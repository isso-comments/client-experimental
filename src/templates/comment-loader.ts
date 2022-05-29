module.exports = (globals) => {
  var comment = globals.comment;
  var i18n = globals.i18n;

  return "" +
"<div class='isso-comment-loader' id='isso-loader-" + comment.name + "'>"
+ "<a class='isso-load-hidden' href='#'>" + i18n.pluralize('comment-hidden', comment.hidden_replies) + "</a>"
+ "</div>"
};
