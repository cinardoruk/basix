# basix - express boilerplate

boilerplate to build and deploy simple htmx SSR websites, so that I can move fast when I have a new product idea.

no typescript, no react, no build step, no ORM, no separate database service to run

session auth
write your own sql queries

## stack

* htmx
* pug
* bootstrap
* express
* sqlite
* docker
* deploy.sh

## extras

* livereload
* bettersqlite3
* schema.sql
* scratch.sql
* basic views ready to go
	* landing
	* login
	* price
	* admin page showing active users etc
* some means to dump/restore sqlite db


# TODO | +basix
* [X] pugjs  #cf87cdd2
* [X] make license MIT  #a846bf0b
* [X] livereload doesn't work. browser console error.  #e16714c4
* [X] /health doesn't work. turn routes into simpler changebase style  #d8325aed
* [X] livereload  #0752c45b
* [X] copy things over from momo  #66d952a0
    * [X] npm run scripts  #0171a0f5
        * [X] local  #1a4578aa
        * [X] LAN  #c8895613
    * [X] simple sqlite bit  #002dac5c
* [ ] put up on github  #ecde1dc4
* [ ] readme.md  #4b6a15da
* [ ] deploy.sh  #5e54c277
    * [ ] db make_copy_and_download  #f5ccd129
    * [ ] docker start/stop  #86bfc251
* [ ] docker  #bb1b7a22
* [ ] dashboard  #c635e038
* [ ] user account panel  #9e567206
    * [ ] change pwd  #f2f20d8a
    * [ ] delete account  #87c7bd48
        * [ ] confirmation  #7d915029
* [ ] admin page  #f8e61508
    * [ ] list of users w/ active/passive  #b296d31b
    * [ ] sql query page(that also lets you save/load/download/upload .db files)  #cbe5722e
        * [ ] django-like?  #4edad734
* [ ] emails  #1be68b5d
    * [ ] email verification  #5e267db1
    * [ ] pwd change  #84c7b0bb
    * [ ] email all users to notify  #fae3d641
        * [ ] email templates  #eb787ed3
        * [ ] add  #48fc92c0
* [o] auth  #c12692c5
    * [X] what do express-session and better-sqlite3-session-store do? do I even need them?  #3ceaef15
    * [ ] drop usernames. just use email  #91d09ae4
