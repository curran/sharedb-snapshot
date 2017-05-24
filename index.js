var async = require('async');

// This function was copied from https://github.com/share/sharedb/issues/45
// Original implementation by https://github.com/luto
function getSnapshotAtRevision(db, docname, v, cb)
{
  var snapshot
    , ops = []

  async.waterfall(
    [
      // get latest revision
      function (cb)
      {
        db.getSnapshot(docname,
          function (err, _snapshot)
          {
            snapshot = _snapshot;
            cb(err);
          }
        );
      },
      // get ops that happend between `v` and `snapshot.v`
      function (cb)
      {
        if(v == snapshot.v)
          return cb();

        db.getOps(docname, v, snapshot.v,
          function (err, _ops)
          {
            ops = _ops;
            cb(err);
          }
        );
      },
      // invert and apply ops
      function (cb)
      {
        var json = sharejs.types.json;
        var content = snapshot.snapshot;
        var err = null;

        try
        {
          for (var i = ops.length - 1; i >= 0; i--) // reverse order
          {
            var op = ops[i].op;
            op = json.invert(op);
            content = json.apply(content, op);
          }
        }
        catch (_err)
        {
          err = _err;
        }

        cb(err, content);
      }
    ],
    cb
  );
}
