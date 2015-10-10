## ChatBoard

ChatBoard is a chat room and interactive whiteboard application built with NodeJS, socket.io, d3.js, and jQuery.

### Usage

To start the chatboard server, run the following from a command line, or use NSSM to install as a service on a Windows machine.

``` node server [--port=port_number]  ```

If not specified, the default listening port is **9000**.

Open your browser to http://localhost:9000. You will see a page that allows you to create a chatboard.

Enter a name and click **Create**.

You will be brought to another page where you will be asked to provide a name and optionally a gravatar email address. The email you provide will be used to fetch a gravatar image for use as your chatboard avatar.

You may also choose to login using Facebook.  The test AppID only works with the default http://localhost:9000. If you wish to host on some domain, you will have to provide your own AppID compatible with your domain.

### Features

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
* Auto-parsing of pasted URLs in chat to links with previews?
* Remove ability to inject HTML/scripting in chat
* Chatboard management

### Notes
* Boards and images uploaded to them are currently persited in memory.
