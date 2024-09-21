let gl; // The webgl context.
let surface; // A surface model
let program; // A shader program
let ball; // A SimpleRotator object that lets the user rotate the view by mouse.

function deg2rad(angle) {
	return (angle * Math.PI) / 180;
}

class SurfaceModel {
	constructor(name) {
		this.name = name;
		this.uLines = [];
		this.vLines = [];
		this.vertexBuffer = null;
	}

	createSurfaceData() {
		const uMin = -1;
		const uMax = 1;
		const vMin = 0.2;
		const vMax = 1;
		const uSteps = 50;
		const vSteps = 50;

		const du = (uMax - uMin) / uSteps;
		const dv = (vMax - vMin) / vSteps;

		// Generate U and V lines
		for (let uIndex = 0; uIndex <= uSteps; uIndex++) {
			const u = uMin + uIndex * du;
			const uLine = [];
			for (let vIndex = 0; vIndex <= vSteps; vIndex++) {
				const v = vMin + vIndex * dv;

				// Parametric equation for Richmond's Minimal Surface
				const x =
					(-3 * u - u ** 5 + 2 * u ** 3 * v ** 2 + 3 * u * v ** 4) /
					(6 * (u ** 2 + v ** 2));
				const y =
					(-3 * v - 3 * u ** 4 * v - 2 * u ** 2 * v ** 3 + v ** 5) /
					(6 * (u ** 2 + v ** 2));
				const z = u;

				uLine.push([x, y, z]);
			}
			this.uLines.push(uLine);
		}

		// Generate V lines by transposing the uLines array
		for (let vIndex = 0; vIndex <= vSteps; vIndex++) {
			const vLine = [];
			for (let uIndex = 0; uIndex <= uSteps; uIndex++) {
				vLine.push(this.uLines[uIndex][vIndex]);
			}
			this.vLines.push(vLine);
		}
	}

	getVertices() {
		const vertices = [];
		// Add U lines
		for (const uLine of this.uLines) {
			for (const point of uLine) {
				vertices.push(...point);
			}
		}
		// Add V lines
		for (const vLine of this.vLines) {
			for (const point of vLine) {
				vertices.push(...point);
			}
		}
		return vertices;
	}

	initBuffer(gl) {
		const vertices = this.getVertices();
		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		this.count = vertices.length / 3;
	}

	draw(gl, program) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(program.vertexAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(program.vertexAttrib);

		const pointsPerLine = this.uLines[0].length;
		const totalUPoints = this.uLines.length * pointsPerLine;

		// Draw U lines
		for (let i = 0; i < this.uLines.length; i++) {
			gl.drawArrays(gl.LINE_STRIP, i * pointsPerLine, pointsPerLine);
		}

		// Draw V lines
		for (let i = 0; i < this.vLines.length; i++) {
			gl.drawArrays(
				gl.LINE_STRIP,
				totalUPoints + i * this.uLines.length,
				this.uLines.length,
			);
		}
	}
}

class ShaderProgram {
	constructor(name) {
		this.name = name;
	}

	use(gl) {
		gl.useProgram(this.prog);

		this.vertexAttrib = gl.getAttribLocation(this.prog, "vertex");
		this.matrixUni = gl.getUniformLocation(this.prog, "matrix");
		this.colorUni = gl.getUniformLocation(this.prog, "color");
	}

	init(gl, vs, fs) {
		const vsh = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vsh, vs);
		gl.compileShader(vsh);
		if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
			throw new Error(`Error in vertex shader: ${gl.getShaderInfoLog(vsh)}`);
		}

		const fsh = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fsh, fs);
		gl.compileShader(fsh);
		if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
			throw new Error(`Error in fragment shader: ${gl.getShaderInfoLog(fsh)}`);
		}

		const prog = gl.createProgram();
		gl.attachShader(prog, vsh);
		gl.attachShader(prog, fsh);
		gl.linkProgram(prog);
		if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
			throw new Error(`Link error in program: ${gl.getProgramInfoLog(prog)}`);
		}

		this.prog = prog;
	}
}

function initSurface() {
	surface = new SurfaceModel("Richmond's Minimal Surface");
	surface.createSurfaceData();
	surface.initBuffer(gl);
}
function initShaderProgram() {
	program = new ShaderProgram("Basic");
	program.init(gl, vertexShaderSource, fragmentShaderSource);
	program.use(gl);
}

function draw() {
	gl.clearColor(1, 1, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	/* Set the values of the projection transformation */
	const projection = m4.perspective(Math.PI / 8, 1, 8, 12);

	/* Get the view matrix from the SimpleRotator object.*/
	const modelView = ball.getViewMatrix();

	const rotateToPointZero = m4.axisRotation(
		[Math.SQRT1_2, Math.SQRT1_2, 0],
		0.7,
	);
	const translateToPointZero = m4.translation(0, 0, -10);

	const matAccum0 = m4.multiply(rotateToPointZero, modelView);
	const matAccum1 = m4.multiply(translateToPointZero, matAccum0);

	const modelViewProjection = m4.multiply(projection, matAccum1);
	gl.uniformMatrix4fv(program.matrixUni, false, modelViewProjection);

	/* setting color for all vertices */
	gl.uniform4fv(
		program.colorUni,
		[0.3803921569, 0.4470588235, 0.9529411765, 1],
	);

	surface.draw(gl, program);
}

function init() {
	const errorMessage = document.createElement("p");
	document.body.appendChild(errorMessage);
	try {
		const canvas = document.querySelector("canvas");
		gl = canvas.getContext("webgl");
		ball = new TrackballRotator(canvas, draw, 0);
		if (!gl) {
			throw "Browser does not support WebGL";
		}
	} catch (e) {
		errorMessage.innerHTML =
			"<p>Sorry, could not get a WebGL graphics context.</p>";
		return;
	}
	try {
		// initialize the WebGL graphics context
		initShaderProgram();
		initSurface();
		gl.enable(gl.DEPTH_TEST);
	} catch (e) {
		errorMessage.innerHTML = `<p>Sorry, could not initialize the WebGL graphics context: ${e}</p>`;
		return;
	}

	draw();
}
