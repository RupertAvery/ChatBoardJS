## ChatBoard

ChatBoard is a chat room and interactive whiteboard application built with NodeJS, d3.js, and jQuery.

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
* Real-time interactive whiteboard
 * Lines (Any colors, using a color selector or a set of predefined colors, 4 selectable widths)
 * Text (currently only black, Arail 16px)
 * Images (upload from local or from an URL)
 * Selection (single or multiple using a selection rectangle)
 * Moving (move single or multiple objects)
 * Paste (currently only paste text and images in clipboard via Ctrl-V)
 * Eraser
 * Delete (remove currently selected objects from whiteboard by pressing the Delete key)
 
### Planned features

* Scaling of selected objects
* More shapes (circle, rectangle, straight lines)
* Text editing and styles
* UI improvements
* Rich text in chat
* Emoticons
* Auto-parsing of pasted URLs in chat to links with previews?
* Remove ability to inject HTML/scripting in chat
* Chatboard management?

### Notes
* Boards and images uploaded to them are currently persited in memory.
