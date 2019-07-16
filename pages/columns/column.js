var data = getDataById("data");
var bodyBackgroundColor = data.color;
var CommonModal;
$(function() {
  NKC.methods.initSelectColor(function(color) {
    $("body").css({
      "background-color": color
    });
    bodyBackgroundColor = color;
  });
  $(".column-fast-set-btn").click(function() {
    toggleFastSettings();
  });
  CommonModal = new NKC.modules.CommonModal();
});

function toggleFastSettings() {
  $(".column-fast-set-body").toggle();
}

function saveSettings() {
  nkcAPI("/m/" + data.columnId, "PATCH", {
    type: "color",
    color: bodyBackgroundColor
  })
    .then(function() {
      screenTopAlert("保存成功");
      toggleFastSettings();
    })
    .catch(function(d) {
      screenTopWarning(d)
    })
}

function openNewWindow(url) {

  window.open(url);
}