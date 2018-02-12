// Flaucon de Neige JS
// snowflake.js

window.onload = function() {
	var width = window.innerWidth, height = window.innerHeight, ratio = window.devicePixelRatio;
	var grid = [], nx = 50, ny = Math.floor(nx * 0.6), skip = 10;
	var rho = 0.8, beta = 1.95, alpha = 0.004, theta = 0.001, kappa = 0.05, mu = 0.015, gamma = 0.0001;
	var canvas = document.getElementsByTagName('canvas')[0], context = canvas.getContext("2d");
	var dx = (height/2)/nx, dy = (dx/2)*Math.sqrt(3), stop = false;
	
	canvas.width = width*ratio;
	canvas.height = height*ratio;
	canvas.style.width = width+"px";
	canvas.style.height = height+"px";
	context.scale(ratio, ratio);
	
	class placement {
		constructor(onDomainBoundary) {
			this.a = 0;
			this.b = 0;
			this.c = 0;
			this.d = rho;
			this.old_a = 0;
			this.old_d = rho;
			this.onDomainBoundary = onDomainBoundary;
			this.onBoundary = false;
			this.N = [];
		}
		
		updatePropagation() {
			if((!this.a) && (!this.onDomainBoundary)) {
				for(var n of this.N) { this.d += n.a?this.old_d:n.old_d; }
				this.d /= 7;
			}
		}
		
		updateFreezing() {
			if((this.onBoundary) && (!this.onDomainBoundary)) {
				this.b += (1-kappa)*this.d;
				this.c += kappa*this.d;
				this.d = 0;
			}
		}
		
		updateAttachement() {
			if((this.onBoundary) && (!this.onDomainBoundary)) {
				var n = 0;
				for(var nei of this.N) { n += nei.old_a; }
				
				if((n === 1) || (n === 2)) { if(this.b >= beta) { this.a = 1; }}
				else if(n === 3) {
					if(this.b >= 1) { this.a = 1; }
					else {
						var d = 0;
						for(var nei of this.N) { d += nei.d; }
						if((d < theta) && (this.b >= alpha)) { this.a = 1; }
					}
				}
				else if(n >= 4) { this.a = 1; }
				
				if(this.a === 1) {
					this.c += this.b;
					this.b = 0;
					for(var nei of this.N) {
						nei.onBoundary = true;
						if(nei.onDomainBoundary) { stop = true; }
					}
				}
			}
		}
		
		updateMelting() {
			if((this.a === 0) && (!this.onDomainBoundary)) {
				this.d += (mu*this.b)+(gamma * this.c);
				this.b *= 1-mu;
				this.c *= 1-gamma;
			}
		}
		
		updateVars() {
			if(!this.onDomainBoundary) {
				this.old_a = this.a;
				this.old_d = this.d;
			}
		}
		
		draw(j, i) {
			var brightness = this.a?(1-(this.c/beta)):(1-this.d), c = Math.floor(255*brightness);
			context.fillStyle = "rgb("+c+","+c+","+c+")";
			context.strokeStyle = context.fillStyle;
			
			var x = width/2 + (j-0.5)*dx, y = height/2 + (i-0.5)*dy;
			context.fillRect(x, y, dx, dy);
			context.strokeRect(x, y, dx, dy);
		}
	}
	
	function init() {
		for(var i = 0; i < ny; i++) {
			grid[i] = [];
			var nxTemp = Math.floor(nx-(1.5*i));
			for(var j = 0; j < nxTemp; j++) { grid[i][j] = new placement((j === nxTemp-1) || (i === ny-1)); }
		}
		
		grid[-1] = [];
		grid[-1][1] = grid[0][1];
		grid[-1][2] = grid[0][1];
		grid[0][-1] = grid[0][1];
		
		for(var i = 0; i < grid[1].length; i++) { grid[-1][i+3] = grid[1][i]; }
		for(var i = 1; i < ny; i++) {
			grid[i][-1] = grid[i-1][1];
			grid[i][-2] = grid[i-2][2];
		}
		
		for(var i = 0; i < ny; i++) {
			var nxTemp = Math.floor(nx - 1.5*i);
			for(var j = 0; j < nxTemp; j++) {
				var c = grid[i][j];
				if(c.onDomainBoundary) { continue; }
				c.N.push(grid[i-1][j+1]);
				c.N.push(grid[i-1][j+2]);
				c.N.push(grid[i][j-1]);
				c.N.push(grid[i][j+1]);
				c.N.push(grid[i+1][j-2]);
				c.N.push(grid[i+1][j-1]);
			}
		}
		
		grid[0][0].a = 1;
		grid[0][0].c = 1;
		grid[0][0].d = 0;
		grid[0][0].updateVars();
		grid[0][1].onBoundary = true;
		animate();
	}
	
	function animate() {
		draw();
		for(var i = 0; i <= skip; i++) { update(); }
		if(!stop) { requestAnimationFrame(animate); }
	}
	
	function draw() {
		var brightness = 1-rho, c = Math.floor(255*brightness);
		context.fillStyle = "rgb("+c+","+c+","+c+")";
		context.fillRect(0, 0, width, height);
		
		for(var i = 0; i < ny; i++) {
			var nxTemp = Math.floor(nx-(1.5*i));
			for(var j = 0; j < nxTemp; j++) {
				var c = grid[i][j];
				c.draw(j+(i*1.5), i);
				c.draw(j+(i*1.5), -i);
				c.draw(-j-(i*1.5), i);
				c.draw(-j-(i*1.5), -i);
				c.draw((0.5*j)+(i*1.5), i+j);
				c.draw((0.5*j)+(i*1.5), -i-j);
				c.draw((-0.5*j)-(i*1.5), i+j);
				c.draw((-0.5*j)-(i*1.5), -i-j);
				c.draw(0.5*j, (2*i)+j);
				c.draw(0.5*j, (-2*i)-j);
				c.draw(-0.5*j, (2*i)+j);
				c.draw(-0.5*j, (-2*i)-j);
			}
		}
	}
	
	function update() {
		for(var i = 0; i < ny; i++) {
			var nxTemp = Math.floor(nx-(1.5*i));
			for(var j = 0; j < nxTemp; j++) {
				c = grid[i][j];
				c.updatePropagation();
				c.updateFreezing();
				c.updateAttachement();
				c.updateMelting();
				c.updateVars();
			}
		}
	}
	
	init();
}

// END
