function init() {
  addClasses();

  function transform(text) {
    const DELIMITER = /\.|,/;
    const index = text.search(DELIMITER);
    const MAX_WORDS = 6;

    function wrap(w, t) {
      return `<strong>${w}</strong> ${t}`;
    }

    if (index > -1 && index <= 50) {
      return wrap(text.split(DELIMITER)[0], text.substring(index));
    }

    const words = text.split(' ');
    const first = words.splice(0, MAX_WORDS);

    return wrap(first.join(' '), words.join(' '));
  }

  const paragraphs = document.querySelectorAll('.posts article .post__body p');

  [].slice.call(paragraphs).forEach(function (p) {
    if (
      p.firstChild &&
      (!p.firstChild.tagName || p.firstChild.tagName !== 'STRONG')
    ) {
      p.innerHTML = transform(p.innerText);
    }
  });
}

function addClasses() {
  const p = document.querySelectorAll('.post article .post__body p');
  p.length > 0 && p[0].classList.add('ingress');
}

document.addEventListener('DOMContentLoaded', init, false);
