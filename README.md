## ChatBoard

ChatBoard is a chat room and interactive whiteboard application built with NodeJS, socket.io, d3.js, and jQuery.

![image](https://cloud.githubusercontent.com/assets/1910659/10409108/4e0bbb46-6f44-11e5-8f46-e038dc2b5a57.png)

### Installing

Run the following command at the root of the project

``` npm install ```

This will install and compile the necessary dependencies.

For Windows users, you may encounter the following or similar error while npm is trying to build certain (optional) dependencies:

``` error MSB8020: The build tools for v140 (Platform Toolset = 'v140') can not be found ```

You can either choose to ignore this error (ChatBoard should work fine) or you can run the following command *before* running ```npm install```

``` SET GYP_MSVS_VERSION=2013 ```

(from https://github.com/nodejs/node-gyp/issues/679)

### Usage

To start the chatboard server, run the following from a command line, or use NSSM to install as a service on a Windows machine.

``` node server [--port=port_number] [--appId=fb_appid] ```

If not specified, the default listening port is **9000**.

The value for **appId** will be injected into the file  ```web/scripts/fb.js``` to replace the token %appId%.

The appId allows you to login to the app using your Facebook account. The appId included in the ```startme-local.cmd``` batch file is registered to the URL http://localhost:9000 so you should be able to login on your local dev machine for testing.

If you would like to use the application on another domain, you will have to register your own appId on Facebook.

Open your browser to http://localhost:9000. You will see a page that allows you to create a chatboard.

Enter a name and click **Create**.

You will be brought to another page where you will be asked to provide a name and optionally a gravatar email address. The email you provide will be used to fetch a gravatar image for use as your chatboard avatar.

You may also choose to login using Facebook.  The test AppID only works with the default http://localhost:9000. If you wish to host on some domain, you will have to provide your own AppID compatible with your domain.

### Features

* Facebook login
* Gravatar integration
* Real-time chat
 * Emoticons
* Real-time interactive whiteboard
 * Shapes
  * Paths
  * Circles
  * Squares
  * Rectangles
  * Lines
 * Line color and fill color
 * Text
 * Images (upload from local or from an URL)
 * Selection
 * Scaling of selected objects
 * Moving
 * Paste clipboard contents (text and image)

### Planned features
* UI improvements
* Rich text in chat
* URL preview in chat
* Remove ability to inject HTML/scripting in chat
* Chatboard management
* Pesist boards to MongoDB/file system

### Notes
* Boards and images uploaded to them are currently persisted in memory. If the server is stopped any boards will be lost.
