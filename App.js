 Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'release',
    comboboxConfig: {
        fieldLabel: 'Select a Release:',
        labelWidth: 100,
        width: 300
    },
  
  addContent: function() {
        var panel = Ext.create('Ext.container.Container', {
            width: 1200,
            layout: 'column',
            itemId: 'parentPanel',
            //componentCls: 'panel',
            items: [
                {
                    xtype: 'container',
                    itemId: 'childPanel1',
                    columnWidth: 0.3
                },
                {
                    xtype: 'container',
                    itemId: 'childPanel2',
                    columnWidth: 0.7
                }
            ]
        });
        this.add(panel);
        //this._makeStore();
    },
    
    onScopeChange: function() {
        
        if (!this.down('#parentPanel')) {
            var panel = Ext.create('Ext.panel.Panel', {
            width: 1200,
            layout: 'column',
            itemId: 'parentPanel',
            componentCls: 'panel',
            items: [
                {
                    xtype: 'panel',
                    //title: 'Stories',
                    itemId: 'childPanel1',
                    columnWidth: 0.3
                },
                {
                    xtype: 'panel',
                    //title: 'Test Sets with Test Cases',
                    itemId: 'childPanel2',
                    columnWidth: 0.7
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
			console.log('selected iteration has no testsets');
			if (this.down('#grid')) {
			    this.down('#grid').destroy();
			}
		    }
		},
                select: function(combobox){
                    
		    if (combobox.getRecord()) {
                        this._onTestSetSelected(combobox.getRecord());
		      //if (this.down('#myChart')) {
			  //this.down('#myChart').destroy();
			  
		      //}
			
		    }	        
                },
                scope: this
            }
	});
	this.down('#childPanel1').add(testSetComboxBox);   
    },
    
     _onTestSetSelected:function(testset){
      //this._myMask = new Ext.LoadMask(Ext.getBody(), {msg:"Please wait.This may take long if you have thousands of results..."});
      //this._myMask.show();
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
              //load: this._onDataLoaded,
            load: function(store,records,success){
   		console.log("loaded %i records", records.length);
   		this._updateGrid(_store);
   	    },
            scope: this
            }
       });
     },
     
    _updateGrid: function(_store){
        if (!this.down('#mygrid')) {
   		this._makeGrid(_store);
   	}
   	else{
   		this.down('#mygrid').reconfigure(_store);
   	}
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
   	this.down('#childPanel2').add(g);
    },

     _onDataLoaded: function(store, data) {
        console.log('data',data);
          this._myMask.hide();
	  var records = [];
	  var verdictsGroups = ["Pass","Fail","Other"]

	  var passCount = 0;
	  var failCount = 0;
          var otherCount = 0;
	  
	  var getColor = {
	      'Pass': '#009900',
	      'Fail': '#FF0000', 
	      'Other': '#A0A0A0'
	  };

	  _.each(data, function(record) {
	      verdict = record.get('Verdict');
	      switch(verdict)
	      {
		case "Pass":
		     passCount++;
		      break;
                case "Fail":
		      failCount++;
		      break;
		case "Blocked":
		      otherCount++;
		      break;
		case "Error":
		      otherCount++;
		      break;
		case "Inconclusive":
		      otherCount++;
	      }
	  });
          
          
          /*
	  if (this.down('#myChart')) {
		      this.remove('myChart');
	  }
	  if (this.down('#myChart2')) {
		      this.remove('myChart2');
	  }
	  this.add(
	      {
			xtype: 'rallychart',
			height: 400,
			storeType: 'Rally.data.WsapiDataStore',
			store: this._myStore,
			itemId: 'myChart',
			chartConfig: {
			    chart: {
				type: 'pie'
			    },
			    title: {
				text: 'TestCaseResults Verdict Counts',
				align: 'center'
			    },
			    tooltip: {
				formatter: function () {
				   //return this.point.name + ': <b>' + Highcharts.numberFormat(this.percentage, 1) + '%</b><br />' + this.point.y;
                                   return this.point.name + '<br />' + this.point.y; //by number. Comment out and uncomment the one above if want %
				    }
			    },
			    plotOptions : {
				 pie: {
				    allowPointSelect: true,
				    cursor: 'pointer',
				    point: {
					events: {
					    click: function(event) {
						var options = this.options;
						alert(options.name + ' clicked');
					    }
					}
				    },
				    dataLabels: {
					enabled: true,
					color: '#000000',
					connectorColor: '#000000'
				    }
				}
			    }
			},            
			chartData: {
			    series: [ 
				{   
				    name: 'Verdicts',
				    data: [
					{name: 'Pass',
					y: passCount,
					color: getColor['Pass']
					},
					{name: 'Fail',
					y: failCount,
					color: getColor['Fail']
					},
					{name: 'Other',
					y: otherCount,
					color: getColor['Other']
					}
				    ]
				}
			    ]
			}
	    }
	);
	this.down('#myChart')._unmask();*/
    }
     
 });
