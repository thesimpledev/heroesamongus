// Package site loads the people data and renders the static pages of Good People.
package site

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

const (
	siteName    = "Good People"
	tagline     = "A little reminder that good people exist."
	commonsFile = "https://commons.wikimedia.org/wiki/File:"
)

var (
	slugPattern  = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)
	yearsPattern = regexp.MustCompile(`^([0-9]{4}–[0-9]{4}|Born [0-9]{4})$`)
	imagePattern = regexp.MustCompile(`^/assets/[a-z0-9-]+\.(jpg|png|webp)$`)
)

// Credit records who took a portrait and under which licence it is used.
type Credit struct {
	Author     string `json:"author"`
	License    string `json:"license"`
	LicenseURL string `json:"licenseUrl"`
	Source     string `json:"source"`
}

// Person is one entry of data/heroes.json.
type Person struct {
	Slug        string `json:"slug"`
	Name        string `json:"name"`
	Years       string `json:"years"`
	Virtue      string `json:"virtue"`
	Description string `json:"description"`
	Reflection  string `json:"reflection"`
	Image       string `json:"image"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	ImageCredit Credit `json:"imageCredit"`
}

// Load reads and validates the people data file.
func Load(path string) ([]Person, error) {
	raw, err := os.ReadFile(path) // #nosec G304 -- the path is the data file named on the command line
	if err != nil {
		return nil, err
	}
	var people []Person
	if err := json.Unmarshal(raw, &people); err != nil {
		return nil, fmt.Errorf("%s: %w", path, err)
	}
	if err := Validate(people); err != nil {
		return nil, fmt.Errorf("%s: %w", path, err)
	}
	return people, nil
}

// Validate checks every entry against the rules the site relies on.
func Validate(people []Person) error {
	if len(people) == 0 {
		return errors.New("no people")
	}
	seen := make(map[string]bool, len(people))
	for i, p := range people {
		if seen[p.Slug] {
			return fmt.Errorf("entry %d: duplicate slug %q", i, p.Slug)
		}
		seen[p.Slug] = true
		if err := validatePerson(p); err != nil {
			return fmt.Errorf("entry %d (%q): %w", i, p.Slug, err)
		}
	}
	return nil
}

func validatePerson(p Person) error {
	if !slugPattern.MatchString(p.Slug) {
		return fmt.Errorf("bad slug %q", p.Slug)
	}
	if err := validateText(p); err != nil {
		return err
	}
	if err := validateImage(p); err != nil {
		return err
	}
	return validateCredit(p.ImageCredit)
}

func validateText(p Person) error {
	fields := map[string]string{
		"name": p.Name, "years": p.Years, "virtue": p.Virtue,
		"description": p.Description, "reflection": p.Reflection,
	}
	for name, value := range fields {
		if strings.TrimSpace(value) == "" {
			return fmt.Errorf("%s is empty", name)
		}
	}
	if !yearsPattern.MatchString(p.Years) {
		return fmt.Errorf("bad years %q", p.Years)
	}
	for _, mark := range []string{`"`, "“", "'", "‘"} {
		if strings.HasPrefix(p.Reflection, mark) {
			return errors.New("reflection starts with a quote mark")
		}
	}
	return nil
}

func validateImage(p Person) error {
	if !imagePattern.MatchString(p.Image) {
		return fmt.Errorf("bad image path %q", p.Image)
	}
	if p.Width <= 0 || p.Height <= 0 {
		return fmt.Errorf("bad image size %dx%d", p.Width, p.Height)
	}
	return nil
}

func validateCredit(c Credit) error {
	if strings.TrimSpace(c.Author) == "" || strings.TrimSpace(c.License) == "" {
		return errors.New("image credit needs an author and a licence")
	}
	if !strings.HasPrefix(c.LicenseURL, "https://") {
		return fmt.Errorf("bad licence URL %q", c.LicenseURL)
	}
	if !strings.HasPrefix(c.Source, commonsFile) {
		return fmt.Errorf("source is not a Commons file page: %q", c.Source)
	}
	return nil
}

// Page is what the template renders: the home page when Person is nil.
type Page struct {
	Base   string
	Person *Person
}

// SiteName is the site's name for titles and metadata.
func (Page) SiteName() string { return siteName }

// Tagline is the site's one-line description.
func (Page) Tagline() string { return tagline }

// Title is the document title.
func (p Page) Title() string {
	if p.Person == nil {
		return siteName + " · " + tagline
	}
	return p.Person.Name + " · " + siteName
}

// Description is the text for the description and Open Graph tags.
func (p Page) Description() string {
	if p.Person == nil {
		return tagline
	}
	return p.Person.Description
}

// Canonical is the page's public URL.
func (p Page) Canonical() string {
	if p.Person == nil {
		return p.Base + "/"
	}
	return p.Base + "/people/" + p.Person.Slug
}

// ImageURL is the absolute portrait URL, empty for the home page.
func (p Page) ImageURL() string {
	if p.Person == nil {
		return ""
	}
	return p.Base + p.Person.Image
}

// LoadTemplate parses the page template.
func LoadTemplate(path string) (*template.Template, error) {
	return template.ParseFiles(path)
}

// RenderPage executes the template for one page.
func RenderPage(tmpl *template.Template, page Page) ([]byte, error) {
	if tmpl == nil {
		return nil, errors.New("nil template")
	}
	page.Base = strings.TrimRight(page.Base, "/")
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, page); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// Sitemap lists every public page.
func Sitemap(base string, people []Person) []byte {
	base = strings.TrimRight(base, "/")
	var buf bytes.Buffer
	buf.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	buf.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` + "\n")
	for _, path := range []string{"/", "/people", "/about"} {
		writeURL(&buf, base+path)
	}
	for _, p := range people {
		writeURL(&buf, base+"/people/"+p.Slug)
	}
	buf.WriteString("</urlset>\n")
	return buf.Bytes()
}

func writeURL(buf *bytes.Buffer, loc string) {
	buf.WriteString("  <url><loc>")
	buf.WriteString(loc)
	buf.WriteString("</loc></url>\n")
}

// Robots allows crawling and points at the sitemap.
func Robots(base string) []byte {
	base = strings.TrimRight(base, "/")
	return []byte("User-agent: *\nAllow: /\nSitemap: " + base + "/sitemap.xml\n")
}

// Config names the inputs and output directory of a generation run.
type Config struct {
	DataPath     string
	TemplatePath string
	OutDir       string
	Base         string
}

// Generate writes the home page, one page per person, the sitemap and robots.txt.
func Generate(cfg Config) error {
	people, err := Load(cfg.DataPath)
	if err != nil {
		return err
	}
	tmpl, err := LoadTemplate(cfg.TemplatePath)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Join(cfg.OutDir, "p"), 0o750); err != nil {
		return err
	}
	if err := writePage(tmpl, Page{Base: cfg.Base}, filepath.Join(cfg.OutDir, "index.html")); err != nil {
		return err
	}
	for i := range people {
		path := filepath.Join(cfg.OutDir, "p", people[i].Slug+".html")
		if err := writePage(tmpl, Page{Base: cfg.Base, Person: &people[i]}, path); err != nil {
			return err
		}
	}
	if err := os.WriteFile(filepath.Join(cfg.OutDir, "sitemap.xml"), Sitemap(cfg.Base, people), 0o600); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(cfg.OutDir, "robots.txt"), Robots(cfg.Base), 0o600)
}

func writePage(tmpl *template.Template, page Page, path string) error {
	out, err := RenderPage(tmpl, page)
	if err != nil {
		return fmt.Errorf("%s: %w", path, err)
	}
	return os.WriteFile(path, out, 0o600)
}
