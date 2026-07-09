support audio, image, video (download and save)

- save to fs, e.g. `downloads/whatsapp/xxx.ogg`
- link in database

```
media
-----
id pk
source enum(whatsapp,telegram,discord)
ws_user_id fk null
tg_user_id fk null
dc_user_id fk null
filename text
content_type text
```
