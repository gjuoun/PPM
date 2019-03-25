document.addEventListener('DOMContentLoaded', function() {
  
  // activate side nav
  var elems = document.querySelectorAll('.sidenav');
  var instances = M.Sidenav.init(elems, {edge:'left',draggable: true});
  
  //
});

$("#reset").on("click", function() {
  $('label').removeClass('active');
});


