(function (Raphael) {
  Raphael.fn.graph = {};
  
  Raphael.fn.graph.enable = function (types)
  {
    // by default only extend circle
    if (!types) types = ['circle'];
    
    // extend given types
    for (var i = 0; i < types.length; i++)
    {
      var type = types[i];
      this[type] = function (paper, fn)
      {
        return function ()
        {
          var element = fn.apply(paper, arguments);
          element.graph = new GraphExtension(element);
          return element;
        };
      }(this, this[type]);
    }
  }
    
  var GraphExtension = function (element)
  {
    this.element = element;
    this.paper = element.paper;
  }
  
  GraphExtension.prototype.graph = function (g)
  {
    return this._graph = g || this._graph;
  }

  GraphExtension.prototype.edgeTo = function (el, weight)
  {
    if (this.graph() && el.graph.graph() && this.graph() !== el.graph.graph()) {
      this.graph().each(function (v)
      {
        // copy this graph to el's graph
        for (var u in this.adj(v))
        {
          var edge = this.get(v, u);
          el.graph.graph().set(v, this.vertex(u), edge);
        }
      
        v.graph.graph(el.graph.graph());
      });
    
    } else {  
      // assign graph
      this.graph(el.graph.graph(this.graph() || el.graph.graph() || new Graph()));
    }
  
    // no loops, no multiedges
    if (this.element === el || this.graph().has(this.element, el))
      return;
  
    // create edge
    this.drawEdge(el);
  
    // attach listeners to redraw edges on drag
    this.setupVertex();
    el.graph.setupVertex();
    
    return this.element;
  }

  GraphExtension.prototype.edgesToTranslate = function ()
  {
    // edges (paths) with two parents in the set
    
    if (!this.element.draggable) return;
    
    if (this.element.draggable.parent && this.element.draggable.parent._to_translate)
    {
      return this.element.draggable.parent._to_translate;
    }
  
    // find edge paths to translate
    var subgraph = this.graph().subgraph(this.element.draggable.parent.items);
    var to_translate = [];
  
    subgraph.each(function (u)
    {
      for (var v in this.adj(u))
      {
        to_translate.push(this.get(u, v))
      }
    });
  
    return this.element.draggable.parent._to_translate = to_translate;
  }

  GraphExtension.prototype.edgesToRedraw = function ()
  {
    // edges (pairs) with one parent in the set
    
    if (!this.element.draggable) return;

    if (this.element.draggable.parent && this.element.draggable.parent._to_redraw)
    {
      return this.element.draggable.parent._to_redraw;
    }
  
    var to_redraw = []; // [[u, v], ...]
    var set_vertices = {}; // 
  
    for (var i = 0; i < this.element.draggable.parent.items.length; i++)
      set_vertices[this.element.draggable.parent.items[i]] = 1;
  
    this.graph().each(function (v)
    {
      for (var u in this.adj(v))
      {
        if (u < v && v in set_vertices !== u in set_vertices)
        {
          to_redraw.push([this.vertex(u), this.vertex(v)]);
        }
      }
    });
  
    return this.element.draggable.parent._to_redraw = to_redraw;
  }

  GraphExtension.prototype.setupVertex = function ()
  {
    if (!this.element.draggable) return;
    
    if (this._setup_vertex) return;
    this._setup_vertex = 1;
    
    // drag start
    this.element.mousedown(function (event)
    {
      if (event.shiftKey)
      {
        // create set or add to existing set
        var set = this.paper._set = this.paper._set || this.paper.set().draggable.enable();
        set.push(this);
        delete set._to_translate;
        delete set._to_redraw;
        this.attr('fill', 'green');
        this.graph.colorNeighbors('red');
      } else if (!this.draggable.parent)
      {
        // check for current set
        if (this.paper._set)
        {
          var set = this.paper._set;
          delete this.paper._set;
          // disable the set
          set.draggable.disable();
          // return everything to original color
          this.graph.graph().each(function (v)
          {
            this.vertex(v).attr('fill', 'blue');
          });
        }
        // color neighbors the active-neighbor color
        this.graph.colorNeighbors('red');
      }
    });
  
    // dragging
    this.element.draggable.dragged(function ()
    {
      // check if we are in a set
      if (this.draggable.parent && this.draggable.parent.draggable.enabled)
      {
        // translate edges with two parents in the set
        var to_translate = this.graph.edgesToTranslate();
        for (var i = 0; i < to_translate.length; i++)
        {
          // translate edge
          var edge = to_translate[i];
          var x = edge.head.attr('cx');
          var y = edge.head.attr('cy');
          edge.translate(x - edge.x, y - edge.y);
          edge.x = x; edge.y = y;
        }
      
        // redraw edges with one parent in the set
        var to_redraw = this.graph.edgesToRedraw();
        for (var i = 0; i < to_redraw.length; i++)
        {
          to_redraw[i][0].graph.drawEdge(to_redraw[i][1]);
        }
      } else
      {
        this.graph.drawEdges();
      }
    });
  
    // drag end
    this.element.mouseup(function ()
    {
      if (!this.draggable.parent)
      {
        // color neighbors the default color
        this.graph.colorNeighbors('blue');
      }
    });
  }

  GraphExtension.prototype.isSetNeighbor = function (v)
  {
    return v.attr('fill') === 'green';
  }

  GraphExtension.prototype.isFringeNeighbor = function (v)
  {
    return v.attr('fill') === 'red';
  }

  GraphExtension.prototype.colorNeighbors = function (color)
  {
    for (var id in this.graph().adj(this.element))
    {
      var v = this.graph().vertex(id);
      if (!this.isSetNeighbor(v))
      {
        this.graph().vertex(id).attr('fill', color)
      }
    }
  
    return this.element;
  }

  GraphExtension.prototype.drawEdges = function ()
  {
    for (var id in this.graph().adj(this.element))
      this.drawEdge(this.graph().vertex(id));
  
    return this.element;
  }

  GraphExtension.prototype.drawEdge = function (el)
  {
    var x1 = this.element.attr('cx'),
      y1 = this.element.attr('cy'), 
      x2 = el.attr('cx'),
      y2 = el.attr('cy');
    
    if (this.graph().has(this.element, el))
    {
      this.graph().get(this.element, el).remove();
    }
  
    // create new edge
    var edge = this.paper.path(['M', x1, y1, 'L', x2, y2]);
    edge.head = this.element;
    edge.x = x1; edge.y = y1;
    this.graph().set(this.element, el, edge);
    this.element.toFront();
    el.toFront();
  
    return this.element;
  }

  Raphael.el.toString = function ()
  {
    // Graph needs toString() on elements to identify vertices
    return "Raphael Object #"+this.id;
  }
})(Raphael);
