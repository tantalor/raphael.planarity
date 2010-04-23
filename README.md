# raphael.planarity

**raphael.planarity** is a plugin for [Raphaël](http://raphaeljs.com/) that implements [Planarity](http://planarity.net).

To instantiate Planarity, call the `planarity(n)` method on a Raphaël object, where `n>=4` is the complexity of the desired graph.

For example,

    Raphael(0, 0, 200, 200).planarity(5);

Please see the description of the [planar graph algorithm ](http://johntantalo.com/wiki/Planarity) for more information about how raphael.planarity generates its planar graphs.
