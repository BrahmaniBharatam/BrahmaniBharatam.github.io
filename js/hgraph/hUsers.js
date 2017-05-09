
var mu = mu  || {};

mu.users = function(){

var usermenu,       // user selection menu bar
    users,          // user data
    userinfo,       // user information bar
    usertimeline,   // user timeline document
    selected;       // currently selected user




var initialize = function(opts){

    usermenu = opts.usermenu || null;
    users = opts.users || null;
    userinfo = opts.userinfo || null;
    transitionTime = 300;             // transition time
    transitionDelayTime = 200;        // transition delay

    var self = this;

    d3.json("data/hgraph/states.json", function(error, json) {
        if (error) return;
        users = json;

        users = _.sortBy(json, 'name');

        // render user menu
        usermenu.html(Mustache.render($('#user-menu-template').html(), users));

        $('.user').change(function(){
            selectUser(this.value);
        });

        selectUser(users[0].name);

    });
};

var selectUser = function(uid){

    updateBarGraph(uid);

    d3.csv("data/parallel/nutrients.csv", function(raw_data) {
        // Convert quantitative scales to floats
        data = raw_data.map(function(d) {
            for (var k in d) {
                if (!_.isNaN(raw_data[0][k] - 0) && k != 'id') {
                    d[k] = parseFloat(d[k]) || 0;
                }
            };
            return d;
        });

        for(var i=0; i<data.length; i++) {
            if(uid === data[i].name) {
                unhighlight();
                highlight(data[i]);
                return;
            }
        }
    });
    for(var i=0; i<users.length; i++) {
        if(uid === users[i].id) {
            initializeUser(users[i]);
            return;
        }
    }
};

var loadHGraph = function(stateName){
    for(var i=0; i<users.length; i++) {
        if(stateName === users[i].id) {
            initializeUser(users[i]);
            return;
        }
    }
}

var initializeUser = function(user) {

    // loads user json datafile
    d3.json("data/hgraph/state-data.json", function(error, json) {
        if (error) return;
        // converts the data to a hGraph friendly format
        var dataPoints = mu.data.process(json[user.id]);
        // renders hGraph
        renderHgraph(dataPoints);
    });

}

return{
       initialize : initialize,
       loadHGraph: loadHGraph
   }
}();