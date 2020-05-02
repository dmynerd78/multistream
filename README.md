# Multistream Viewer

![Multistream dashboard][1]

Inspired by [@benbaptist](https://github.com/benbaptist)'s multistream website. He got busy so I figured I'd make my own version.  

## [Live version here](https://dmynerd78.me/multi/)

### Features

    - Show as many streams as you want!  
    - Show chats only  
    - Show videos only  
    - Show channel viewer count (Twitch also supports uptime)  


[1]: data:image/png;base64,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