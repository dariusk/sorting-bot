# sorting-hat (Sorting Hat)

The source code to [@SortingBot](http://twitter.com/SortingBot).

For a partial explanation of this code, see [this blog post](http://tinysubversions.com/notes/sorting-bot).

This consists of two programs:

* `watcher.js` - This is watching for new follows and adding them to the `queue` list in a Redis DB. Runs persistently (run on boot and use [forever](http://npmjs.org/package/forever) or similar as a wrapper).

* `index.js` - This runs once a minute and pops the queue, generating a poem for the next person in line.

You need to be running a redis database for the bot to work.

## License
Copyright (c) 2015 Kazemi, Darius
Licensed under the MIT license.
