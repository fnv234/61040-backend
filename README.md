# 6.104 Assignment 4: Implementing Concepts

## Changes to App Design
See [Changes to app design](./design/design_changes.md)

## Concepts
See [Concepts](./design/concepts/)




# Setup (Prep)


### Task:

In `design/brainstorming/questioning.md`, complete the `# prompt: Why ... ?` with your burning question for the universe. Then, from the root of the repository, run this command in the terminal (if you're using Obsidian, you should be able to copy the command by clicking on `Shell` in the top right):

```shell
./ctx prompt design/brainstorming/questioning.md
```

You should see any thinking appear in the terminal, with the rest of the completion streamed into the file. In general, you can `prompt` a LLM to chime in with 

```shell
./ctx prompt <path_to_file>.md
```

where `<path_to_file>` is also a link **relative to the root** of the repository.

## 2. Including context

You can **include** other documents to embed their contents, allowing you to compose exactly the context that you want. In Obsidian's file explorer on the left, expand the `design/background` and `design/learning` folders, then click on `understanding-concepts`. This should open a blank document.

### Task:

Drag and drop `concept-design-overview` into the body of `understanding-concepts`. This should show up as a normal link. Then, to make it a link that Context will include, simply add the `@` sign to the beginning of the link text (the part in the brackets), like so:


**Important:** includes should be on their own paragraph - make sure that there's an empty line between them and other content. 

Next, type `# question: ...` and fill in any question you have about concepts, then prompt through Context. 

**Tip:** you can easily get the relative link you need to paste into a terminal after `./ctx prompt` by right/ctrl clicking the file in the explorer directly:


## 3. Viewing context

The `context` directory is an immutable and complete history of every file that the tool interacts with - this means that you shouldn't be afraid of editing or deleting files! This directory is a mirror of the rest of the repository, just nested one layer deeper. In addition, files such as `understanding-concepts.md` become a directory, as in `understanding-concepts.md/` and contain a timestamped version of its entire history. 

### Context folders

Each Markdown file within these directories have the format `timestamp.hash_id.md`, where the `hash_id` is a **content-based hash** that helps you identify, across the entire repository, usages of the same document or content. 

### Individual steps

Inside the `steps` directory one layer deeper are granular files of the form `step.hash_id.md` that contain all the unique steps (`# heading 1` blocks) ever present in the file. This helps identify at-a-glance what the contents of each document are, such as prompts or responses. By default, the `step` in the file name is a `_` character, unless the heading contains a prefix of the form `# prefix: ...`, which can be a useful way to break up a document (that you can follow yourself, or prompt an LLM to do so).


### Task:

1. Consider again `design/brainstorming/questioning`, and **find** the version of the document in `context` containing the LLM's response. Note that `ctx prompt` will save both a before and after version. Drag or insert a link to this in `design/learning/exercise-0`
2. Go back to `questioning`, and **edit** the response to put in your own typed answer. **Tip:** you can collapse the entire response heading (hover to the left of the heading, and click the downwards arrow) and select it quickly to delete the entire block.
3. Use `./ctx save <link_to_questioning.md>` to manually **save** the file to `context`, then find the updated version and link to it in the `exercise-0` document.
4. Use Context to save `exercise-0` as well. (Optional): delete any of these files - if you've properly saved/prompted, we'll be able to find it in the context. We encourage you to continue to prompt/save your brainstorming and learning, and they will help with finding interesting moments for your assignment!

**Note:** `ctx save` is only necessary if you manually edit files, such as your second response to `questioning` or your solutions that you copy paste into `exercise-0`. Any time you `ctx prompt`, both the before and after versions are automatically saved.
# Implementing concepts

You're now ready to create the context that you need to implement concepts with (or without) the aid of an LLM! We've provided you with a number of documents/prompts in `design/background`, each its own self-contained bit of knowledge about concept design in general and implementing them in TypeScript. 

- `design/background`: Background knowledge that you should treat as both prompts and documentation for you to read about concept design. Feel free to add any additional background documents that you think are good prompts. Also, if you think you can contribute, you may also edit any existing prompts and point them out!
- `design/brainstorm`: Plan, chat with an LLM, use as a scratch pad - create and synthesize context about your potential ideas.
- `design/concepts`: Place your actual concept spec documents here. Feel free to copy a whole document from `brainstorm` if you started there and trim down, or simply mutate in place (with `ctx prompt` or `ctx save` throughout).
- `design/learning`: When you feel like you've learned something significant, such as important decisions or caveats/challenges you encounter, record them here. **Tip:** you can always copy an entire document from another place (like `brainstorm`), add a `# summarize: extract the important lessons from everything above`, followed by a `ctx prompt`, then simply delete the original parts.

### Task:

Implement your concepts, either using LLM assistance through `ctx prompt`, or implementing by hand and documenting your progress with `ctx save`. The following tips may help:

### Sample concept: LikertSurvey

We've included a sample concept called LikertSurvey. This is a different version than shown in lecture, where the specification itself was also completely generated. You can inspect `design/concepts/LikertSurvey` to see exactly how this was done, and its history in `context`. This concept is saved, so feel free to delete the design or the source code (useful to delete at least the testing file to prevent it from running when you execute all tests). 

**Generated concept:** notice that `LikertSurvey/LikertSurvey.md` is actually a link pointing to the specific **step** of that previous generation in the context! This is also an embedded link, meaning that Obsidian previews it for you automatically. You can upgrade any link to an embedded link by putting an `!` in front of it, and as long as you still have the `@` sign in the link text, Context will treat it as an include all the same.

### Implementation

Look around the background folder and see which might help you implement concepts, depending on how much of an existing design you already have. The `LikertSurvey/implementation` document gives one example of how this was done. The file that contains most of the information about the technical details of concept implementations is `implementing-concepts.md`.

### Testing

You can read about testing in `testing-concepts.md`. In general, we're using all the standard options, and for testing the current prompts use the [Deno testing framework](https://docs.deno.com/runtime/fundamentals/testing/). Tests are defined by any file with the name `filename.test.ts` in your directory. To run all tests, simply run:

```shell
deno test -A
```

where the `-A` flag means to give all permissions. Be careful with this - it's convenient, but Deno's default security model helps you find if a package you import is sneakily trying to do something your program doesn't (like load local files). There's plenty of [documentation](https://docs.deno.com/runtime/fundamentals/security/) about a more scoped approach to this.

**Confirming your setup:** run the command above to make sure that you've configured everything correctly. You should see in your MongoDB Atlas console the created collections in the test database! These are temporary and will be wiped every time you start a new test.

