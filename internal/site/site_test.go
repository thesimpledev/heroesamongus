package site

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const base = "https://example.test"

func fixturePeople(t *testing.T) []Person {
	t.Helper()
	people, err := Load(filepath.Join("testdata", "people.json"))
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	return people
}

func templatePath(t *testing.T) string {
	t.Helper()
	return filepath.Join("..", "..", "templates", "page.html.tmpl")
}

func TestLoadReadsEveryField(t *testing.T) {
	people := fixturePeople(t)
	if len(people) != 2 {
		t.Fatalf("got %d people, want 2", len(people))
	}
	first := people[0]
	if first.Slug != "example-one" || first.Name != "Example One" || first.Width != 1200 || first.Height != 1600 {
		t.Errorf("unexpected first person: %+v", first)
	}
	if first.ImageCredit.LicenseURL != "https://creativecommons.org/licenses/by/2.0/" {
		t.Errorf("licence URL not read: %+v", first.ImageCredit)
	}
}

func TestLoadRejectsMissingFile(t *testing.T) {
	if _, err := Load(filepath.Join("testdata", "missing.json")); err == nil {
		t.Fatal("expected an error for a missing file")
	}
}

func TestValidateRejectsBadData(t *testing.T) {
	good := fixturePeople(t)
	cases := map[string]func(p []Person) []Person{
		"empty list":        func(p []Person) []Person { return nil },
		"duplicate slug":    func(p []Person) []Person { p[1].Slug = p[0].Slug; return p },
		"bad slug":          func(p []Person) []Person { p[0].Slug = "Not Valid"; return p },
		"missing name":      func(p []Person) []Person { p[0].Name = " "; return p },
		"missing years":     func(p []Person) []Person { p[0].Years = ""; return p },
		"bad years":         func(p []Person) []Person { p[0].Years = "1957–"; return p },
		"missing virtue":    func(p []Person) []Person { p[0].Virtue = ""; return p },
		"missing text":      func(p []Person) []Person { p[0].Description = ""; return p },
		"quoted reflection": func(p []Person) []Person { p[0].Reflection = "\"Quoted\""; return p },
		"bad image path":    func(p []Person) []Person { p[0].Image = "example.jpg"; return p },
		"zero width":        func(p []Person) []Person { p[0].Width = 0; return p },
		"zero height":       func(p []Person) []Person { p[0].Height = 0; return p },
		"missing author":    func(p []Person) []Person { p[0].ImageCredit.Author = ""; return p },
		"missing licence":   func(p []Person) []Person { p[0].ImageCredit.License = ""; return p },
		"bad licence url":   func(p []Person) []Person { p[0].ImageCredit.LicenseURL = "ftp://x"; return p },
		"bad source":        func(p []Person) []Person { p[0].ImageCredit.Source = "https://example.com/x"; return p },
	}
	for name, mutate := range cases {
		t.Run(name, func(t *testing.T) {
			people := append([]Person(nil), good...)
			if err := Validate(mutate(people)); err == nil {
				t.Errorf("expected validation to fail")
			}
		})
	}
	if err := Validate(good); err != nil {
		t.Errorf("fixture should be valid: %v", err)
	}
}

func TestSitemapListsEveryPage(t *testing.T) {
	out := string(Sitemap(base, fixturePeople(t)))
	for _, want := range []string{
		"<loc>https://example.test/</loc>",
		"<loc>https://example.test/people</loc>",
		"<loc>https://example.test/about</loc>",
		"<loc>https://example.test/people/example-one</loc>",
		"<loc>https://example.test/people/example-two</loc>",
	} {
		if !strings.Contains(out, want) {
			t.Errorf("sitemap missing %s", want)
		}
	}
}

func TestRobotsPointsAtSitemap(t *testing.T) {
	out := string(Robots(base))
	if !strings.Contains(out, "Sitemap: https://example.test/sitemap.xml") {
		t.Errorf("robots.txt missing sitemap line: %q", out)
	}
	if !strings.Contains(out, "Allow: /") {
		t.Errorf("robots.txt should allow crawling: %q", out)
	}
}

func TestRenderPersonPage(t *testing.T) {
	tmpl, err := LoadTemplate(templatePath(t))
	if err != nil {
		t.Fatalf("LoadTemplate: %v", err)
	}
	person := fixturePeople(t)[0]
	out, err := RenderPage(tmpl, Page{Base: base, Person: &person})
	if err != nil {
		t.Fatalf("RenderPage: %v", err)
	}
	html := string(out)
	for _, want := range []string{
		"<title>Example One · Good People</title>",
		`<link rel="canonical" href="https://example.test/people/example-one">`,
		`<meta property="og:title" content="Example One">`,
		`<meta property="og:url" content="https://example.test/people/example-one">`,
		`<meta property="og:image" content="https://example.test/assets/example-one.jpg">`,
		`<meta property="og:image:width" content="1200">`,
		`<meta property="og:image:height" content="1600">`,
		`<meta name="twitter:card" content="summary">`,
		`<body data-person="example-one">`,
		`<h2 tabindex="-1">Example One</h2>`,
		`<p class="virtue">Kindness</p>`,
		`<span class="years">1900–1980</span>`,
		`Photograph: Example Photographer`,
		`href="https://commons.wikimedia.org/wiki/File:Example_One.jpg"`,
		`&lt;nothing&gt;`,
	} {
		if !strings.Contains(html, want) {
			t.Errorf("person page missing %s", want)
		}
	}
	if strings.Contains(html, "Finding someone wonderful") {
		t.Error("person page should not carry the loading placeholder")
	}
}

func TestRenderHomePage(t *testing.T) {
	tmpl, err := LoadTemplate(templatePath(t))
	if err != nil {
		t.Fatalf("LoadTemplate: %v", err)
	}
	out, err := RenderPage(tmpl, Page{Base: base})
	if err != nil {
		t.Fatalf("RenderPage: %v", err)
	}
	html := string(out)
	for _, want := range []string{
		"<title>Good People · A little reminder that good people exist.</title>",
		`<link rel="canonical" href="https://example.test/">`,
		`<meta property="og:url" content="https://example.test/">`,
		"Finding someone wonderful",
		`<body>`,
	} {
		if !strings.Contains(html, want) {
			t.Errorf("home page missing %s", want)
		}
	}
	if strings.Contains(html, "og:image") || strings.Contains(html, "data-person") {
		t.Error("home page should not carry person metadata")
	}
}

func TestGenerateWritesEveryFile(t *testing.T) {
	out := t.TempDir()
	err := Generate(Config{
		DataPath:     filepath.Join("testdata", "people.json"),
		TemplatePath: templatePath(t),
		OutDir:       out,
		Base:         base,
	})
	if err != nil {
		t.Fatalf("Generate: %v", err)
	}
	for _, name := range []string{
		"index.html",
		filepath.Join("p", "example-one.html"),
		filepath.Join("p", "example-two.html"),
		"sitemap.xml",
		"robots.txt",
	} {
		if _, statErr := os.Stat(filepath.Join(out, name)); statErr != nil {
			t.Errorf("%s not written: %v", name, statErr)
		}
	}
}

func TestGenerateRefusesInvalidData(t *testing.T) {
	bad := filepath.Join(t.TempDir(), "bad.json")
	if err := os.WriteFile(bad, []byte(`[{"slug":"x"}]`), 0o600); err != nil {
		t.Fatal(err)
	}
	err := Generate(Config{DataPath: bad, TemplatePath: templatePath(t), OutDir: t.TempDir(), Base: base})
	if err == nil {
		t.Fatal("expected invalid data to be refused")
	}
}
