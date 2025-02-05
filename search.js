class Search extends JSQuery.Plugin {
  Element() {
    return {
      window() {
        return this.elt.contentWindow;
      },
      $(q = "") {
        return $.from(this.elt.querySelector(q));
      },
      all(q) {
        return $.from(this.elt.querySelectorAll(q));
      },
      rect() {
        return this.elt.getBoundingClientRect();
      }
    };
  }
}

$.loadPlugin(Search, true);
