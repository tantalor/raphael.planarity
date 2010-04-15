(function (Raphael) {
  Raphael.el.graph = function (g)
  {
    return this._graph = g || this._graph;
  }

  Raphael.el.edgeTo = function (el, weight)
  {
    if (this.graph() && el.graph() && this.graph() !== el.graph()) {
      this.graph().each(function (v)
      {
        // copy this graph to el's graph
        for (var u in this.adj(v))
        {
          var edge = this.get(v, u);
          el.graph().set(v, this.vertex(u), edge);
        }
      
        v.graph(el.graph());
      });
    
    } else {  
      // assign graph
      this.graph(el.graph(this.graph() || el.graph() || new Graph()));
    }
  
    // no loops, no multiedges
    if (this === el || this.graph().has(this, el))
      return;
  
    // create edge
    this.drawEdge(el);
  
    // attach listeners to redraw edges on drag
    this.setupVertex();
    el.setupVertex();
    
    return this;
  }

  Raphael.el.edgesToTranslate = function ()
  {
    // edges (paths) with two parents in the set
    
    if (!this.draggable) return;
    
    if (this.draggable.parent && this.draggable.parent._to_translate)
    {
      return this.draggable.parent._to_translate;
    }
  
    // find edge paths to translate
    var subgraph = this.graph().subgraph(this.draggable.parent.items);
    var to_translate = [];
  
    subgraph.each(function (u)
    {
      for (var v in this.adj(u))
      {
        to_translate.push(this.get(u, v))
      }
    });
  
    return this.draggable.parent._to_translate = to_translate;
  }

  Raphael.el.edgesToRedraw = function ()
  {
    // edges (pairs) with one parent in the set
    
    if (!this.draggable) return;

    if (this.draggable.parent && this.draggable.parent._to_redraw)
    {
      return this.draggable.parent._to_redraw;
    }
  
    var to_redraw = []; // [[u, v], ...]
    var set_vertices = {}; // 
  
    for (var i = 0; i < this.draggable.parent.items.length; i++)
      set_vertices[this.draggable.parent.items[i]] = 1;
  
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
  
    return this.draggable.parent._to_redraw = to_redraw;
  }

  Raphael.el.setupVertex = function ()
  {
    if (!this.draggable) return;
    
    if (this._setup_vertex) return;
    this._setup_vertex = 1;
    
    // drag start
    this.mousedown(function (event)
    {
      if (event.shiftKey)
      {
        // create set or add to existing set
        var set = this.paper._set = this.paper._set || this.paper.set().draggable.enable();
        set.push(this);
        delete set._to_translate;
        delete set._to_redraw;
        this.attr('fill', 'green');
        this.colorNeighbors('red');
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
          this.graph().each(function (v)
          {
            this.vertex(v).attr('fill', 'blue');
          });
        }
        // color neighbors the active-neighbor color
        this.colorNeighbors('red');
      }
    });
  
    // dragging
    this.draggable.dragged(function ()
    {
      // check if we are in a set
      if (this.draggable.parent && this.draggable.parent.draggable.enabled)
      {
        // translate edges with two parents in the set
        var to_translate = this.edgesToTranslate();
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
        var to_redraw = this.edgesToRedraw();
        for (var i = 0; i < to_redraw.length; i++)
        {
          to_redraw[i][0].drawEdge(to_redraw[i][1]);
        }
      } else
      {
        this.drawEdges();
      }
    });
  
    // drag end
    this.mouseup(function ()
    {
      if (!this.draggable.parent)
      {
        // color neighbors the default color
        this.colorNeighbors('blue');
      }
    });
  }

  Raphael.el.isSetNeighbor = function (v)
  {
    return v.attr('fill') === 'green';
  }

  Raphael.el.isFringeNeighbor = function (v)
  {
    return v.attr('fill') === 'red';
  }

  Raphael.el.colorNeighbors = function (color)
  {
    for (var id in this.graph().adj(this))
    {
      var v = this.graph().vertex(id);
      if (!this.isSetNeighbor(v))
      {
        this.graph().vertex(id).attr('fill', color)
      }
    }
  
    return this;
  }

  Raphael.el.drawEdges = function ()
  {
    for (var id in this.graph().adj(this))
      this.drawEdge(this.graph().vertex(id));
  
    return this;
  }

  Raphael.el.drawEdge = function (el)
  {
    var x1 = this.attr('cx'),
      y1 = this.attr('cy'), 
      x2 = el.attr('cx'),
      y2 = el.attr('cy');
    
    if (this.graph().has(this, el))
    {
      this.graph().get(this, el).remove();
    }
  
    // create new edge
    var edge = this.paper.path(['M', x1, y1, 'L', x2, y2]);
    edge.head = this;
    edge.x = x1; edge.y = y1;
    this.graph().set(this, el, edge);
    this.toFront();
    el.toFront();
  
    return this;
  }

  Raphael.el.toString = function ()
  {
    // Graph needs toString() to identify vertices
    return "Raphael Object #"+this.id;
  }
})(Raphael);
