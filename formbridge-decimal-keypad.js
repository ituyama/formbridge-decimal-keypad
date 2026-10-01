(function () {
  'use strict';

  var ATTR = 'data-fb-decimal-keypad';

  function shouldPatch(input) {
    if (!input || input.tagName !== 'INPUT') return false;
    if (input.type === 'tel' || input.type === 'email' || input.type === 'password') return false;
    if (input.closest('[data-field-type="POSTAL_CODE"]')) return false;
    if (input.getAttribute('maxlength') === '1' || input.getAttribute('maxlength') === '2') return false;

    var wrap = input.closest('[data-field-type="NUMBER"]');
    if (!wrap) return false;

    // FormBridgeの数値欄: type=text + inputmode=numeric
    var type = (input.getAttribute('type') || 'text').toLowerCase();
    if (type !== 'text' && type !== 'number') return false;

    return true;
  }

  function patch(input) {
    if (!shouldPatch(input)) return;
    if (input.getAttribute(ATTR) === '1' && input.getAttribute('inputmode') === 'decimal') return;

    input.setAttribute('inputmode', 'decimal');
    // iOS向け。type=number だとFormBridge側とぶつかるので触らない
    input.setAttribute(ATTR, '1');
  }

  function scan(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('[data-field-type="NUMBER"] input').forEach(patch);
    // 念のため既存のnumericも拾う
    scope.querySelectorAll('input[inputmode="numeric"]').forEach(patch);
  }

  function start() {
    scan(document);

    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'childList') {
          m.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            if (node.matches && node.matches('input')) patch(node);
            else scan(node);
          });
        } else if (m.type === 'attributes' && m.target && m.target.tagName === 'INPUT') {
          patch(m.target);
        }
      }
    });

    obs.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['inputmode', 'type']
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
