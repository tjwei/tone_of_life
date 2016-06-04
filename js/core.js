(function ()
{
	'use strict';
	var Core = tm.Class(
	{

		BPM: 120,
		ROWS: 16,
		COLUMNS: 16,
		NOTESIZE: 50,
		currentScale: 'Pentatonic',
		SCALES: {
			Pentatonic: ['E6', 'D6', 'C6', 'A5', 'G5', 'E5', 'D5', 'C5', 'A4', 'G4', 'E4', 'D4', 'C4', 'A3', 'G3', 'E3', 'D3'],
			Minor: ['F5','E5','D5', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3', 'G3', 'F3', 'E3']
		},

		grid: [],
                elem: [],
		noteIndex: 0,

		constructor: function (opts)
		{
			this.setScale(localStorage.getItem('scale') || this.currentScale);
			this.Synth = new tm.Synth(
			{
				bpm: this.BPM,
				rows: this.ROWS
			});

			this.generateGrid();

			this.startLoop();
			this.events();
		},

		startLoop: function ()
		{
			clearInterval(this.loop);
			this.loop = setInterval(this.audioLoop.bind(this), 60 / this.BPM / 2 * 1000);
		},

		stopLoop: function ()
		{
			clearInterval(this.loop);
			this.loop = null;
		},

		setScale: function (scale)
		{
			this.currentScale = scale;
			localStorage.setItem('scale', scale);
		},

		setBpm: function (bpm)
		{
			this.BPM = bpm;
			localStorage.setItem('bpm', bpm);
			this.startLoop();
		},

		toggleNote: function (e, state)
		{
			if(e.target.id != 'tonematrix') {
				var row = e.target.getAttribute('data-row');
				var column = e.target.getAttribute('data-column');
				var note = state !== undefined ? state : this.grid[row][column];
				var action = note ? 'remove' : 'add';

				this.grid[row][column] = +!note;
				e.target.classList[action]('active');
			}
			else{
                            console.log("tonematrix");
                        }
		},

		handleEvent: function (e)
		{
			if (e.target.classList && e.target.classList.contains('note'))
			{
				if (e.type === 'mousedown')
				{
					this.dragging = true;
					this.noteIsActive = e.target.classList.contains('active');
				}
				if (e.type === 'mousemove')
				{
					if (this.dragging)
					{
						this.toggleNote(e, this.noteIsActive);
					}
				}
			}
			if (e.type === 'mouseup')
			{
				this.dragging = false;
				window.location.hash = tm.encode(this.grid);
				localStorage.setItem('notes', tm.encode(this.grid));
			}
		},
                gameLoop: function()
                {
                    var g = [];
                    for(var i=0;i<this.grid.length;i++){
                        g[i]=[];
                        for(var j=0;j<this.COLUMNS;j++) {
                            var c = 0;
                             if(j+1<this.COLUMNS){
                                 if(this.grid[i][j+1]==1) c++;
                                 if(i>0 && this.grid[i-1][j+1]==1) c++;
                                 if(i+1<this.grid.length && this.grid[i+1][j+1]==1) c++;
                             }
                            if(i>0 && this.grid[i-1][j]==1) c++;
                            if(i+1<this.grid.length &&  this.grid[i+1][j]==1) c++;
                            if(j >0 ){
                                 if(this.grid[i][j-1]==1) c++;
                                 if(i>0 && this.grid[i-1][j-1]==1) c++;
                                 if(i+1<this.grid.length && this.grid[i+1][j-1]==1) c++;
                             }
                            var r = this.grid[i][j];
                            if(this.grid[i][j]==1 && c<2) r=0;
                            if(this.grid[i][j]==1 && c>3) r=0;
                            if(this.grid[i][j]==0 && c==3) r=1;
                            g[i].push(r);
                        }
                    }
                    for(var i=0;i<this.grid.length;i++){
                        for(var j=0;j<this.COLUMNS;j++) {
                            if(g[i][j]!=this.grid[i][j])
                                this.toggleNote( {target: this.elem[i][j]} );
                        }
                    }
                    
                    
                            
                },

		audioLoop: function ()
		{
                       
			var currentTime = this.Synth.context.currentTime - this.startTime;

			for (var i = 0; i < this.grid.length; i++)
			{
				if (this.grid[i][this.noteIndex])
				{
					this.hitNote(tm.$(i + '' + this.noteIndex));
					this.Synth.playNote(this.SCALES[this.currentScale][i]);
				}
			}

			this.noteIndex++;
			if (this.noteIndex === this.COLUMNS)
			{
				this.noteIndex = 0;
                                if(document.getElementById('game').checked)
                                        this.gameLoop();
			}
			
		},

		hitNote: function (note)
		{
			note.classList.add('hit');
			setTimeout(function ()
			{
				note.classList.remove('hit');
			}, 500);
		},

		generateGrid: function ()
		{
			var i = 0;
			var j;
			var note;
			var tmpGrid = tm.decode(window.location.hash.slice(1) || localStorage.getItem('notes')) || [];

			for (; i < this.ROWS; i++)
			{
				this.grid[i] = [];
                                this.elem[i]=[];
				for (j = 0; j < this.COLUMNS; j++)
				{
					this.grid[i].push(0);

					note = document.createElement('div');
					note.id = i + '' + j;
					note.style.cssText = 'width: ' + (this.NOTESIZE - 1) + 'px; height: ' + (this.NOTESIZE - 1) + 'px; top: ' + this.NOTESIZE * i + 'px; left: ' + this.NOTESIZE * j + 'px';
					note.setAttribute('data-row', i);
					note.setAttribute('data-column', j);
					note.classList.add('note');
                                        this.elem[i].push(note);

					tm.$('tonematrix').appendChild(note);

					if (tmpGrid[i] && tmpGrid[i][j])
					{
						this.grid[i][j] = 1;
						note.classList.add('active');
					}
				}
			}
		},

		events: function ()
		{
			tm.$('tonematrix').on('click', this.toggleNote.bind(this), false);
			tm.$('tonematrix').on('mousedown', this, false);
			tm.$('tonematrix').on('mousemove', this, false);
			window.addEventListener('mouseup', this, false);
			window.addEventListener('blur', this.stopLoop.bind(this), false);
			window.addEventListener('focus', this.startLoop.bind(this), false);
		}
	});

	tm.Core = Core;

})();
