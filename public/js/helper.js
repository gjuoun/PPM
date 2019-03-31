function $(selector) {
  if (selector !== document)
    return document.querySelector(selector)
  return document
}


export {$}
