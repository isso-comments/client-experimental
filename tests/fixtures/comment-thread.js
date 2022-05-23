// Example response from http://localhost:8080/?uri=%2Fdemo%2Findex.html&nested_limit=5
module.exports = {
  "id": null,
  "total_replies": 4,
  "hidden_replies": 2,
  "replies": [
    {
      "id": 1,
      "parent": null,
      "created": 1651770353.6739655,
      "modified": null,
      "mode": 1,
      "text": "<p>Hi John, thank you for this wonderful article!</p>\n\n<p>However, I still struggle with <em>how</em> to apply the <a href=\"https://example.org/thing\" rel=\"nofollow noopener\">thing you mentioned</a> to my own use case. I've tried using the <code>malleable logarithmic casing</code> you suggested, but somehow my <strong>Turbo encabulator</strong> still experiences side fumbling.</p>\n\n<p>Any further ideas?</p>",
      "author": "Sue",
      "website": "https://example.org",
      "likes": 7,
      "dislikes": 2,
      "notification": 0,
      "hash": "1548cf654b4d",
      "gravatar_image": "https://www.gravatar.com/avatar/4eec8ecba9d91f00de594fa5267d1c88?d=identicon&s=55",
      "total_replies": 2,
      "hidden_replies": 0,
      "replies": [
        {
          "id": 3,
          "parent": 1,
          "created": 1651770506.4728968,
          "modified": null,
          "mode": 1,
          "text": "<p>Hey, I'm a bit privacy conscious so I commented anonymously - which works great, thanks!</p>\n\n<p>I struggle with a similar issue as Sue - could it be related to me only using five hydrocoptic marzelvanes?</p>",
          "author": null,
          "website": null,
          "likes": 1,
          "dislikes": 0,
          "notification": 0,
          "hash": "8c2488ea3011",
          "gravatar_image": "https://www.gravatar.com/avatar/d41d8cd98f00b204e9800998ecf8427e?d=identicon&s=55",
        },
        {
          "id": 4,
          "parent": 1,
          "created": 1651770847.0300038,
          "modified": null,
          "mode": 1,
          "text": "<p>Hi sue, hi anonymous commenter, great to hear you enjoyed my article. Have you ensured that the two spurving bearings are in a direct line with the <code>pentametric fan</code>?</p>",
          "author": "John",
          "website": "http://website.org",
          "likes": 3,
          "dislikes": 10,
          "notification": 0,
          "hash": "0c7d4cd57a0f",
          "gravatar_image": "https://www.gravatar.com/avatar/61409aa1fd47d4a5332de23cbf59a36f?d=identicon&s=55",
        }
      ]
    },
    {
      "id": 2,
      "parent": null,
      "created": 1651770409.0220017,
      "modified": null,
      "mode": 1,
      "text": "<p>Great to see you writing again, John! Looking forward to meeting up again and sharing family pictures.</p>",
      "author": "Angelo",
      "website": "https://example.org",
      "likes": 4,
      "dislikes": 0,
      "notification": 0,
      "hash": "6688cdc5cb0b",
      "gravatar_image": "https://www.gravatar.com/avatar/d9e9aa0dc2bae9810b46775dd4341591?d=identicon&s=55",
      "total_replies": 0,
      "hidden_replies": 0,
      "replies": []
    }
  ],
  "config": {
    "reply-to-self": false,
    "require-email": false,
    "require-author": false,
    "reply-notifications": false,
    "gravatar": false
  }
}
