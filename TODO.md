# basix - express boilerplate

boilerplate to build and deploy simple htmx websites, so that I can move fast when I have a new product idea.

no typescript, no react, no build step

stack
* htmx
* pug
* bootstrap
* express
* sqlite
* docker
* deploy.sh

extras
* livereload
* bettersqlite3
* schema.sql
* scratch.sql
* basic views ready to go
	* landing
	* login
	* price
	* admin page showing active users etc
* auth ready to go
	* passport.js
* some means to dump/restore sqlite db


# TODO | +basix
* [X] pugjs  #cf87cdd2
* [X] make license MIT  #a846bf0b
* [X] livereload doesn't work. browser console error.  #e16714c4
* [X] /health doesn't work. turn routes into simpler changebase style  #d8325aed
* [X] livereload  #0752c45b
* [ ] put up on github  #ecde1dc4
* [o] copy things over from momo  #66d952a0
    * [X] npm run scripts  #0171a0f5
        * [X] local  #1a4578aa
        * [X] LAN  #c8895613
    * [ ] simple sqlite bit  #002dac5c
* [ ] readme.md  #4b6a15da
* [ ] deploy.sh  #5e54c277
    * [ ] db make_copy_and_download  #f5ccd129
    * [ ] docker start/stop  #86bfc251
* [ ] docker  #bb1b7a22
* [ ] auth  #c12692c5
