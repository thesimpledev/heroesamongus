// CloudFront Function (viewer request, JavaScript runtime 2.0) for heroesamongus.art.
// Maps clean URLs to the files in the bucket and redirects every legacy form.
// Tested by test/urls.test.mjs; deployed with the steps in DEPLOY.md.
var SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
var PERSON = /^\/people\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;
var LEGACY_PERSON = /^\/(?:p|people)\/([a-z0-9]+(?:-[a-z0-9]+)*)\.html$/;
var SECTIONS = { '/people': '/gallery.html', '/about': '/about.html' };
var LEGACY = { '/about.html': '/about', '/gallery.html': '/people', '/gallery': '/people' };

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { location: { value: location } }
  };
}

function has(table, key) {
  return Object.prototype.hasOwnProperty.call(table, key);
}

function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var person = request.querystring.person;
  if (uri === '/' && person && SLUG.test(person.value)) {
    return redirect('/people/' + person.value);
  }
  if (uri.length > 1 && uri.charAt(uri.length - 1) === '/') {
    return redirect(uri.slice(0, -1));
  }
  var legacy = LEGACY_PERSON.exec(uri);
  if (legacy) return redirect('/people/' + legacy[1]);
  if (has(LEGACY, uri)) return redirect(LEGACY[uri]);
  if (has(SECTIONS, uri)) {
    request.uri = SECTIONS[uri];
    return request;
  }
  var clean = PERSON.exec(uri);
  if (clean) request.uri = '/p/' + clean[1] + '.html';
  return request;
}
