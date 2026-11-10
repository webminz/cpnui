# Phase 5: SML Editor 

The goal of this phase is to implement ergonomic editor support for the Standard ML (SML) 
expressions that are used to define arc inscriptions, transition guards, initial markings etc.
**Note:** This is will be a complicated endaveour and requires good planning and some initial 
research to discover already existing solutions etc.

## Global definitions

Every coloured petri net has a set of global definitions.
These are `colorsets`, i.e. basically _type aliases_ and variables that associate a `name` with a `colorset`.
Currently, there is now way to edit this global definitions.
Before starting with the SML support, we need an editor pane to edit these.


## Text Editor component

The current input elements (mostly `textarea`s) concerning SML expressions, i.e.:

- global definitions (color sets and variables),
- Arc inscriptions,
- Transition guards,
- Transition durations, and 
- Place initial markings 

must be replaced by a more complete `TextEditor` component.
The common choices here are probably `Monaco` or `CodeMirror`.
You will need to decide for one of the one that fits best for this project, add the dependency and integrate it 
into the "new" `TextEditor` component.


## Syntax Highlighting

A gentle first step would be to add syntax highlighting for Standard ML (encorporating the CPN syntax additions such 
as `colset`) based on the chose editor framework.


## Find or develop Language Server for Standard ML

The biggest challenge is to obtain a functioning _language server_ for StandardML.
The choices are either to implement one from scratch or to find something existing.
Concerning the complexity of writing a language server from scratch, it may be worthwile to spend 
some time looking for existing solutions.
A good starting point could be the GitHub repository of the StandardML New Jersy <https://github.com/smlnj>.
An idea would be to see if there is an existing language server binary (which could directly be integrated into the project)
or at least a comprehensive library in top of which such a language server could quickly be developed.

## Server deployment and protocol implementation

Once, a language server is obtained, you need to find a way to smothly integrate it into the project 
such that the text editor can contact the language server over the LSP protocol (need to find out whether communication 
can be via STDIN or sockets).
Then, the language server has to hooked up with all the editor components in a resource-efficient way.
Also, for each editor window, probably an individual context for the LSP has to be constructed.
Concretely, the color sets are recognized as types and also the variables from the global definitions can be used. 
