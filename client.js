function scrollToBottom(id){
   var div = document.getElementById(id);
   div.scrollTop = div.scrollHeight - div.clientHeight;
}
scrollToBottom('log-box');
scrollToBottom('chat-box');

var statsModal = document.getElementById('stats-modal');
var statsButton = document.getElementById('show-stats');
var statsClose = document.getElementsByClassName('modal-close')[0];
statsButton.onclick = function() {
    statsModal.style.display = 'flex';
}
statsClose.onclick = function() {
    statsModal.style.display = 'none';
}
window.onclick = function(event) {
    if (event.target == statsModal) {
        statsModal.style.display = 'none';
    }
}

var loginModal = document.getElementById('login-modal');
var enterButton = document.getElementById('enter');
window.onload = function(event) {
    loginModal.style.display = 'flex';
}
enterButton.onclick = function() {
  loginModal.style.display = 'none';
}

var clearButton = document.getElementById('clear-log');
clearButton.onclick = function() {
  document.getElementById('log-box').innerHTML = "";
}
