Fragment Quickstart Guide - Table of contents
   * [About Fragment](#aboutfragment)
   * [Quickstart](#quickstart)
      * [Sessions](#sessions)
      * [User interface](#userinterface)
      * [Making sounds](#makingsounds)
      * [MIDI](#midi)
      * [Fragment Audio Server](#fragmentaudioserver)
   * [Help](#help)

## About Fragment

Fragment is a collaborative cross-platform real-time audiovisual live coding environment with a pixels based approach, the sound synthesis is powered by pixels data produced by live GLSL code.

The GLSL code is executed on the GPU for each pixels (also called fragments), this approach allow hardware accelerated real-time manipulation of the pixels data, making it a bliss to create stunning visuals or stunning sound design.

Videos of most features are available on [YouTube](https://www.youtube.com/c/FragmentSynthesizer)

**Note**

- With web. browser audio, Fragment is **limited to additive synthesis** and two output channels.

For more features launch the Fragment Audio Server (available on the [homepage](https://www.fsynth.com)) for fast additive/granular/karplus/subtractive/PM sound synthesis, multi-output channels (linking to any Digital Audio Workstation) and many other features.

## Quickstart

### Sessions

This is a Fragment session, a session is a public, anonymous and collaborative space containing session-specific GLSL code and settings such as canvas parameters and slices parameters, all the sessions you joined in are saved locally and can be joined back by going to the [homepage](https://www.fsynth.com)

You can invite friends to join your session and collaborate online by sharing the link shown in the address bar

### User interface

Fragment interface is made of 4 parts

- info. panel/gain settings at the top
- a graphical area which represent frequency on the vertical axis and time on the horizontal axis
- a toolbar
- a GLSL code editor

### Making sounds

When a session is created for the first time, an example code is made available with a basic MIDI setup, this setup allow playing with an additive synthesis SAW-like waveform and a ~440Hz continuous tone, the audio output is paused by default.

To hear the tone, slice the graphical canvas by right-clicking anywhere on the canvas, click on the (+) icon which appeared then click on the play button.

Slices capture the pixels data, the captured data is then sent to the sound synthesis engine in real-time.

Any number of slices can be added, slices can be removed, muted or tweaked by right-clicking on it.

Slices can be moved by clicking on it, holding it and moving the cursor around.

You can also open the slices dialog which show an overview of all slices by double clicking anywhere on the canvas.

You can experiment right away with the sound/visual by tweaking the values of this sample program in the GLSL code editor, any modifications is updated in real-time as you type.

### MIDI

To play a saw-like waveform with a MIDI keyboard, click on the Jack plug icon on the toolbar to open the MIDI settings dialog and enable your MIDI controller.

### Fragment Audio Server

The Fragment audio server (FAS) is necessary for fast sound synthesis, additive/granular/subtractive/Karplus/PM synthesis, multiple output channels and many other professional grade features.

[Please checkout the software documentation to setup the audio server on your machine.](https://www.fsynth.com/documentation/tutorials/audio_server/)

## Help

- Click on the ? icon on the toolbar, many code snippets, interactive guides and informations are available
- Checkout the [software documentation](https://www.fsynth.com/documentation)
- Post on the [Fragment message board](https://quiet.fsynth.com)

Have fun!