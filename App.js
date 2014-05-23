 Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'release',
    comboboxConfig: {
        fieldLabel: 'Select a Release:',
        labelWidth: 100,
        width: 300
    },
    
    onScopeChange: function() {
        
        if (!this.down('#parentPanel')) {
            var panel = Ext.create('Ext.panel.Panel', {
            //width: 1200,
            layout: 'column',
            itemId: 'parentPanel',
            componentCls: 'panel',
            items: [
                {
                    xtype: 'panel',
                    itemId: 'pickerContainer',
                    columnWidth: 0.2
                },
                {
                    xtype: 'panel',
                    itemId: 'gridContainer',
                    columnWidth: 0.8
                }
            ]
        });
        this.add(panel);
        }
        
       if (this.down('#testSetComboxBox')) {
	    this.down('#testSetComboxBox').destroy();   
	}
	 if (this.down('#myChart')) {
	    this.down('#myChart').destroy();
	 }

            var testSetComboxBox = Ext.create('Rally.ui.combobox.ComboBox',{
	    itemId: 'testSetComboxBox',
	    storeConfig: {
		model: 'TestSet',
		limit: Infinity,
		pageSize: 100,
		autoLoad: true,
		filters: [this.getContext().getTimeboxScope().getQueryFilter()]
	    },
	    fieldLabel: 'select TestSet',
	    listeners:{
                ready: function(combobox){
		    if (combobox.getRecord()) {
			this._onTestSetSelected(combobox.getRecord());
		    }
		    else{
			console.log('selected release has no testsets');
			if (this.down('#mygrid')) {
			    this.down('#mygrid').destroy();
			}
		    }
		},
                select: function(combobox){
                    
		    if (combobox.getRecord()) {
                        this._onTestSetSelected(combobox.getRecord());
		    }	        
                },
                scope: this
            }
	});
	this.down('#pickerContainer').add(testSetComboxBox);   
    },
    
     _onTestSetSelected:function(testset){
        var that = this;
	var _store = Ext.create('Rally.data.WsapiDataStore', {
           model: 'Test Case Result',
	   limit: Infinity,
           fetch: ['Verdict','TestCase','Build', 'FormattedID'],
	   filters:[
	    {
	      property: 'TestSet',
	      value: testset.get('_ref')
	    }
	   ],
           autoLoad: true,
           groupField: 'Build',
           listeners: {
            load: function(store,records,success){
   		console.log("loaded %i records", records.length);
   		this._updateGrid(_store,records);
   	    },
            scope: this
            }
       });
     },
     
    _updateGrid: function(_store,records){
        console.log('records', records);
        if (!this.down('#mygrid')) {
   		this._makeGrid(_store);
   	}
   	else{
   		this.down('#mygrid').reconfigure(_store);
   	}
         this._prepareChart(records);
     },
       
    _makeGrid: function(_store){
        console.log('make grid');
   	var g = Ext.create('Rally.ui.grid.Grid', {
   		store: _store,
		features: [{ftype:'grouping'}],
                itemId: 'mygrid',
   		columnCfgs: [
   			{text: 'Verdict', dataIndex: 'Verdict'},
   			{
			text: 'TestCase', dataIndex: 'TestCase',
			   renderer: function(tc){
				return '<a href="' + Rally.nav.Manager.getDetailUrl(tc) + '">' + tc.FormattedID + '</a>'
			}
                        
                }
   		],
   		width: 200
   	});
   	this.down('#gridContainer').add(g);
    },
    
    _prepareChart:function(records){
        var count = 0;
       var that = this;
        var builds = [];
        that._series = [];
        that._categories = [];
        that._data = [];
        that._records = [];
        _.each(records, function(record){
            that._records.push(record.data)
            builds.push(record.data.Build);
        });
        var uniqueBuilds = _.uniq(builds);
        console.log(that._records);
        console.log(uniqueBuilds);

        that._resultsPerBuild = {};
        that._resultsPerBuild = _.object(_.map(uniqueBuilds, function(item) {
            return [item, count]
        }));
        
        _.each(that._records, function(result) {
            for (k in that._resultsPerBuild){
                    if (k === result.Build) {
                        that._resultsPerBuild[k]++;
                }
            }
        });
        console.log(that._resultsPerBuild);
        
        for (k in that._resultsPerBuild){
            that._categories.push(k);
            that._data.push({name: k, y: that._resultsPerBuild[k]})
        }
        
        that._makeChart();
    },
    
    _makeChart: function(){
       if (this.down('#myChart')) {
            this.remove('myChart');
        }
        this.add(
        {
            xtype: 'rallychart',
            itemId: 'myChart',
            //width: 600,
            chartConfig: {
                chart:{
                type: 'column',
                zoomType: 'xy'
                },
                title:{
                    text: 'Results per Build'
                },
                xAxis: {
                    title: {
                        enabled: true,
                        tickInterval: 1,
                        text: 'tags'
                },
                startOnTick: true,
                endOnTick: true,
                showLastLabel: true,
                allowDecimals: false,
                },
                yAxis:{
                    title: {
                        text: 'Results'
                },
                allowDecimals: false
                },
            },
                            
            chartData: { 
                categories: this._categories,
                series:[
                    {
                       type: 'column',
                       name: 'Results',
                       data: this._data
                    }
                    
                ]
                
                
            }
          
        });
        this.down('#myChart')._unmask();
     
    }
     
 });
