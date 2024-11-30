export class ShaderProgram {
	constructor(name) {
		this.name = name;
	}

	use(gl) {
		gl.useProgram(this.prog);
		this.setupAttributes(gl);
		this.setupUniforms(gl);
	}

	setupAttributes(gl) {
		this.vertexAttrib = gl.getAttribLocation(this.prog, "vertex");
		this.normalAttrib = gl.getAttribLocation(this.prog, "normal");
		this.texCoordAttrib = gl.getAttribLocation(this.prog, "texCoord");
		this.tangentAttrib = gl.getAttribLocation(this.prog, "tangent");
	}

	setupUniforms(gl) {
		this.matrixUni = gl.getUniformLocation(this.prog, "matrix");
		this.normalMatrixUni = gl.getUniformLocation(this.prog, "normalMatrix");
		this.lightDirectionUni = gl.getUniformLocation(this.prog, "lightDirection");
		this.viewPositionUni = gl.getUniformLocation(this.prog, "viewPosition");
		this.ambientColorUni = gl.getUniformLocation(this.prog, "ambientColor");
		this.diffuseColorUni = gl.getUniformLocation(this.prog, "diffuseColor");
		this.specularColorUni = gl.getUniformLocation(this.prog, "specularColor");
		this.shininessUni = gl.getUniformLocation(this.prog, "shininess");
		this.diffuseTextureUni = gl.getUniformLocation(this.prog, "diffuseTexture");
		this.specularTextureUni = gl.getUniformLocation(
			this.prog,
			"specularTexture",
		);
		this.normalTextureUni = gl.getUniformLocation(this.prog, "normalTexture");
	}

	init(gl, vertexShaderSource, fragmentShaderSource) {
		const vertexShader = this.loadShader(
			gl,
			gl.VERTEX_SHADER,
			vertexShaderSource,
		);
		const fragmentShader = this.loadShader(
			gl,
			gl.FRAGMENT_SHADER,
			fragmentShaderSource,
		);

		this.prog = gl.createProgram();
		gl.attachShader(this.prog, vertexShader);
		gl.attachShader(this.prog, fragmentShader);
		gl.linkProgram(this.prog);

		if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
			throw new Error(
				`Unable to initialize the shader program: ${gl.getProgramInfoLog(this.prog)}`,
			);
		}
	}

	loadShader(gl, type, source) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error(
				`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
			);
		}

		return shader;
	}
}
