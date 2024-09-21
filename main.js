let gl; // The webgl context.
let surface; // A surface model
let program; // A shader program
let ball; // A SimpleRotator object that lets the user rotate the view by mouse.

function deg2rad(angle) {
	return (angle * Math.PI) / 180;
}

// Constructor
function Model(name) {
	this.name = name;
	this.vertexBuffer = gl.createBuffer();
	this.count = 0;

	this.initBuffer = function (vertices) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

		this.count = vertices.length / 3;
	};

	this.draw = function () {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(program.vertexAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(program.vertexAttrib);

		gl.drawArrays(gl.LINE_STRIP, 0, this.count);
	};
}

// Constructor
function ShaderProgram(name, program) {
	this.name = name;
	this.prog = program;

	// Location of the attribute variable in the shader program.
	this.vertexAttrib = -1;
	// Location of the uniform specifying a color for the primitive.
	this.colorUni = -1;
	// Location of the uniform matrix representing the combined transformation.
	this.matrixUni = -1;

	this.use = function () {
		gl.useProgram(this.prog);
	};
}

/* draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
	gl.clearColor(0, 0, 0, 1);
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

	/* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
	const modelViewProjection = m4.multiply(projection, matAccum1);

	gl.uniformMatrix4fv(program.matrixUni, false, modelViewProjection);

	/* setting color for an all vertices. */
	gl.uniform4fv(program.colorUni, [1, 1, 0, 1]);

	surface.draw();
}

function CreateSurfaceData() {
	const vertexList = [];

	for (let i = 0; i < 360; i += 5) {
		vertexList.push(Math.sin(deg2rad(i)), 1, Math.cos(deg2rad(i)));
		vertexList.push(Math.sin(deg2rad(i)), 0, Math.cos(deg2rad(i)));
	}

	return vertexList;
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
	const prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

	program = new ShaderProgram("Basic", prog);
	program.use();

	program.vertexAttrib = gl.getAttribLocation(prog, "vertex");
	program.matrixUni = gl.getUniformLocation(prog, "matrix");
	program.colorUni = gl.getUniformLocation(prog, "color");

	surface = new Model("Surface");
	surface.initBuffer(CreateSurfaceData());

	gl.enable(gl.DEPTH_TEST);
}

/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
	const vsh = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vsh, vShader);
	gl.compileShader(vsh);
	if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
		throw new Error(`Error in vertex shader:  ${gl.getShaderInfoLog(vsh)}`);
	}
	const fsh = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fsh, fShader);
	gl.compileShader(fsh);
	if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
		throw new Error(`Error in fragment shader:  ${gl.getShaderInfoLog(fsh)}`);
	}
	const prog = gl.createProgram();
	gl.attachShader(prog, vsh);
	gl.attachShader(prog, fsh);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		throw new Error(`Link error in program:  ${gl.getProgramInfoLog(prog)}`);
	}
	return prog;
}

/**
 * initialization function that will be called when the page has loaded
 */
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
		initGL(); // initialize the WebGL graphics context
	} catch (e) {
		errorMessage.innerHTML = `<p>Sorry, could not initialize the WebGL graphics context: ${e}</p>`;
		return;
	}

	draw();
}
