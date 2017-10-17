/*
 * This is a thin wrapper around markdown-it.
 */

var MarkdownIt = require('markdown-it')
  , md = new MarkdownIt();

/* Customization:
 * Add 'class=table' to <table> elements for proper Bootstrap display.
 */
md.renderer.rules.table_open = (/* tokens, idx, options, env, self */) => {
    return '<table class="table">\n';
};

/**
 * @param {string} markdown - markdown text to parse
 * @return {html} rendered HTML
 */
exports.parse = (markdown) => md.render(markdown);

