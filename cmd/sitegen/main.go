// Command sitegen renders the home page, one page per person, the sitemap and
// robots.txt from data/heroes.json and templates/page.html.tmpl.
package main

import (
	"flag"
	"log"

	"github.com/thesimpledev/heroesamongus/internal/site"
)

func main() {
	cfg := site.Config{}
	flag.StringVar(&cfg.DataPath, "data", "data/heroes.json", "people data file")
	flag.StringVar(&cfg.TemplatePath, "template", "templates/page.html.tmpl", "page template")
	flag.StringVar(&cfg.OutDir, "out", ".", "output directory")
	flag.StringVar(&cfg.Base, "base", "https://heroesamongus.art", "public base URL")
	flag.Parse()
	if err := site.Generate(cfg); err != nil {
		log.Fatal(err)
	}
}
