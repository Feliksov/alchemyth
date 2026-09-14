// Subscribe form -> mailto fallback (no backend yet)
document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('subscribeForm');
    if (form) {
          form.addEventListener('submit', function (e) {
                  e.preventDefault();
                  var email = document.getElementById('subscribeEmail').value;
                  var note = document.getElementById('formNote');
                  window.location.href = 'mailto:hello@alchemyth.ru?subject=' +
                            encodeURIComponent('Подписка на открытие Alchemyth') +
                            '&body=' + encodeURIComponent('Прошу уведомить меня об открытии магазина.\nEmail: ' + email);
                  if (note) note.style.display = 'block';
          });
    }

                            // Catalog category filter
                            var filterBtns = document.querySelectorAll('.filter-btn');
    var cards = document.querySelectorAll('.product-card');
    if (filterBtns.length) {
          filterBtns.forEach(function (btn) {
                  btn.addEventListener('click', function () {
                            filterBtns.forEach(function (b) { b.classList.remove('active'); });
                            btn.classList.add('active');
                            var cat = btn.getAttribute('data-cat');
                            cards.forEach(function (card) {
                                        var show = cat === 'all' || card.getAttribute('data-cat') === cat;
                                        card.style.display = show ? '' : 'none';
                            });
                  });
          });
    }
});
