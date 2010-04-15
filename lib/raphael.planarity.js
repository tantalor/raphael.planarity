(function (Raphael) {
  function pairIndex (p, q, n)
  {
    if (p >= q)
      return pairIndex(q, p, n);
    
    return (p*(2*n-p-1)/2)+q-p;
  }

  function intersection (a, b)
  {
    return (b[1]-a[1]) / (a[0]-b[0]);
  }
  
  Raphael.fn.planarity = function (n, cx, cy)
  {
    // enable dragging
    if (this.draggable)
      this.draggable.enable();
    
    // enable graph
    this.graph.enable(['circle']);
    
    // where are we putting this thing?
    cx = cx === undefined ? this.width / 2 : cx;
    cy = cy === undefined ? this.height / 2 : cy;
    var cr = Math.min(cx, cy) - 10, twopi = 6.28;
    
    // create vertices
    var vertices = new Array();
    for (var i = 0, k = n*(n-1)/2; i < k; i++)
    {
      var x = cx+cr*Math.cos(i/k*twopi), y = cy+cr*Math.sin(i/k*twopi)
      var circle = this.circle(x, y, 8).attr('fill', 'blue');
      vertices.push(circle);    
      // enable dragging
      if (circle.draggable)
        circle.draggable.enable();
    }
    
    // create n random lines
    var lines = new Array();
    for (var i = 0; i < n; i++)
    {
      lines.push([Math.random(), Math.random()]);
    }
    
    // create planar graph following the intersection algorithm
    for (var i = 0; i < n; i++)
    {
      // compute intersection of line i with all other lines
      var m = [], sort = {};
      for (var j = 0; j < n; j++)
      {
        if (j != i)
        {
          m.push(j);
          sort[j] = intersection (lines[i], lines[j]);
        }
      }
      
      // sort by intersection
      m.sort(function (a, b)
      {
        return sort[a] - sort[b];
      });
      
      // create edges between adjacent intersections
      for (var j = 0; j < n - 2; j++)
      {
        var u = pairIndex(i, m[j], n) - 1;
        var v = pairIndex(i, m[j+1], n) - 1;
        vertices[u].graph.edgeTo(vertices[v]);
      }
    }
    
    return this;
  }
})(Raphael);
