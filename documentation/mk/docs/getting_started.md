## Getting Started

The quickest way to get started is to join/create a session on the [homepage](https://www.fsynth.com)

You can also use the Fragment launcher available on the homepage as a .deb package for Ubuntu/Debian and executable files for Windows, the launcher keep a list of the sessions you joined in, it is also bundled with the audio server to provide excellent audio performances.

To use the launcher on Ubuntu/Debian system :

- Download the .deb package on the [homepage](https://www.fsynth.com)
- In a terminal `sudo dpkg -i fragment_1.1_amd64.deb`
- If the line above fail due to missing dependencies : `sudo apt-get install -f`

Once the session is created, you will join automatically the Fragment application, an example code which produce basic sounds willl be provided automatically along with a quickstart guide.

The Fragment user interface layout is made of :

- an information bar at the top
- the canvas which is the drawing surface
- a toolbar
- the code editor, you will instruct your GPU there to draw things on the canvas

To hear the example sound, you need to slice the canvas in vertical chunks to capture the pixels produced by the example code, you can do that by **right-clicking anywhere on the canvas** and then by **clicking on the + icon**.

If you hear a simple 440hz tone, congratulations! Time to move on to the tutorial!