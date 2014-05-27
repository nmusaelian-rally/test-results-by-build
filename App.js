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
            this._panel = Ext.create('Ext.panel.Panel', {
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
                    columnWidth: 0.3
                },
                {
                    xtype: 'panel',
                    itemId: 'chartContainer',
                    columnWidth: 0.5
                }
            ]
        });
        this.add(this._panel);
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
       
    _makeGrid: function(_store, records){
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
        var passCount = 0;
	var failCount = 0;
        var otherCount = 0;

       
       var count = 0;
       var that = this;
        var builds = [];
        that._series = [];
        that._categories = [];
        recordsData = [];
        _.each(records, function(record){
            recordsData.push(record.data)
            builds.push(record.data.Build);
        });
        var uniqueBuilds = _.uniq(builds);
        //console.log(recordsData);
        //console.log(uniqueBuilds);

        that._resultsPerBuild = {};
        that._resultsPerBuild = _.object(_.map(uniqueBuilds, function(item) {
            return [item, count]
        }));
        
        var passPerBuild = {};
        var failPerBuild = {};
        var otherPerBuild = {};
        var passData = [];
        var failData = [];
        var otherData = [];
        
        passPerBuild = _.object(_.map(uniqueBuilds, function(item) {
            return [item, count]
        }));
        
        failPerBuild = _.object(_.map(uniqueBuilds, function(item) {
            return [item, count]
        }));
        
        otherPerBuild = _.object(_.map(uniqueBuilds, function(item) {
            return [item, count]
        }));
        
        _.each(recordsData, function(result) { 
            for (k in that._resultsPerBuild){
                    if (k === result.Build) {
                        that._resultsPerBuild[k]++;
                }
            }

            if (result.Verdict === 'Pass') {
                for (k in passPerBuild){
                    if (k === result.Build) {
                        passPerBuild[k]++;
                    }
                }
            }
            else if (result.Verdict === 'Fail') {
                for (k in failPerBuild){
                    if (k === result.Build) {
                        failPerBuild[k]++;
                    }
                }
            }
            else{
                for (k in otherPerBuild){
                    if (k === result.Build) {
                        otherPerBuild[k]++;
                    }
                }
            }
            
        });
        //console.log(that._resultsPerBuild);
        
        for (k in that._resultsPerBuild){
            that._categories.push(k);
        }
        
        for (k in passPerBuild){
            passData.push({build: k, y: passPerBuild[k], color: '#009900'})
        }
        
        for (k in failPerBuild){
            failData.push({build: k, y: failPerBuild[k], color: '#FF0000'})
        }
        
        for (k in otherPerBuild){
            otherData.push({build: k, y: otherPerBuild[k], color: '#FF8000'})
        }

       var allData = [];
       allData.push(passData);
       allData.push(failData);
       allData.push(otherData);
       
       //console.log('allData',allData);
       
      
        that._series.push({
            name: 'Fail',
            data: failData
        })
        that._series.push({
            name: 'Other',
            data: otherData
        })
        that._series.push({
            name: 'Pass',
            data: passData
        })
         
        
        that._makeChart();
    },
    
    _makeChart: function(){
       if (this.down('#myChart')) {
            this.remove('myChart');
        }
        //this.down('#chartContainer').add(
        //{
            //xtype: 'rallychart',
            var myChart = Ext.create('Rally.ui.chart.Chart', {
            itemId: 'myChart',
            chartConfig: {
                chart:{
                type: 'column',
                zoomType: 'xy'
                },
                title:{
                    text: 'Results per Build'
                },
                 plotOptions : {
                    column: {
                    stacking: 'normal'
                    }
                },
                xAxis: {
                    title: {
                        enabled: true,
                        tickInterval: 1,
                        text: 'builds'
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
                series: this._series
                
            }
          
        });
        this.down('#chartContainer').add(myChart);    
        this.down('#myChart')._unmask();
     
    }
     
 });
