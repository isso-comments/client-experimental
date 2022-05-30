module.exports = (params) => {
  const i18n = params.i18n;
  const comment = params.comment;
  const conf = params.conf;
  const datetime = params.datetime;
  const humanize = params.humanize;
  const svg = params.svg;

  const author = comment.author ? comment.author : i18n.translate('comment-anonymous');
  const isPageAuthor = conf["page-author-hashes"].indexOf(comment.hash) > -1;
  const pageAuthorClass = (isPageAuthor ? " isso-is-page-author" : '');

  return "" +
"<div class='isso-comment" + pageAuthorClass + "' id='isso-" + comment.id + "' data-hash='" + comment.hash + "'>"
+ (conf.gravatar ? "<div class='isso-avatar'><img src='" + comment.gravatar_image + "'></div>" : '')
+ (conf.avatar ? "<div class='isso-avatar'><svg data-hash='" + comment.hash + "'</svg></div>" : '')
+ "<div class='isso-text-wrapper'>"
  + "<div class='isso-comment-header' role='meta'>"
    + (comment.website
        ? "<a class='isso-author' href='" + comment.website + "' rel='nofollow'>" + author + "</a>"
        : "<span class='isso-author'>" + author + "</span>")
    + (isPageAuthor
        ? "<span class='isso-spacer'>&bull;</span>"
          + "<span class='isso-page-author-suffix'>" + i18n.translate('comment-page-author-suffix') + "</span>"
        : '' )
     + "<span class='isso-spacer'>&bull;</span>"
     + "<a class='isso-permalink' href='#isso-" + comment.id + "'>"
       + "<time title='" + humanize(comment.created) + "' datetime='" + datetime(comment.created) + "'>" + humanize(comment.created) + "</time>"
     + "</a>"
     + "<span class='isso-note'>"
         + (comment.mode == 2 ? i18n.translate('comment-queued') : (comment.mode == 4 ? i18n.translate('comment-deleted') : ''))
     + "</span>"
  + "</div>" // .text-wrapper
  + "<div class='isso-text'>"
    + (comment.mode == 4 ? '<p>&nbsp;</p>' : comment.text)
  + "</div>" // .text
  + "<div class='isso-comment-footer'>"
    + (conf.vote
        ? "<a class='isso-upvote' href='#'>" + svg['arrow-up'] + "</a>"
          + "<span class='isso-spacer'>|</span>"
          + "<a class='isso-downvote' href='#'>" + svg['arrow-down'] + "</a>"
        : '')
     + "<a class='isso-reply' "
       + "data-textreply='" + i18n.translate('comment-reply') + "' "
       + "data-textclose='" + i18n.translate('comment-close') + "' href='#'>"
       + i18n.translate('comment-reply') + "</a>"
     + "<a class='isso-edit' "
       + "data-textsave='" + i18n.translate('comment-save') + "' "
       + "data-textedit='" + i18n.translate('comment-edit') + "' "
       + "data-textcancel='" + i18n.translate('comment-cancel') + "' href='#'>"
       + i18n.translate('comment-edit') + "</a>"
     + "<a class='isso-delete' "
       + "data-textconfirm='" + i18n.translate('comment-confirm') + "' "
       + "data-textdelete='" + i18n.translate('comment-delete') + "' href='#'>"
       + i18n.translate('comment-delete') + "</a>"
  + "</div>" // .isso-comment-footer
+ "</div>" // .text-wrapper
+ "<div class='isso-follow-up'></div>"
+ "</div>" // .isso-comment
};
