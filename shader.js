const vertexShaderSource = `
    attribute vec3 vertex;
    attribute vec3 normal;
    attribute vec2 texCoord;
    attribute vec3 tangent;
    uniform mat4 matrix;
    uniform mat4 normalMatrix;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vTexCoord;
    varying vec3 vTangent;
    varying vec3 vBitangent;

    void main() {
        vec4 position = matrix * vec4(vertex, 1.0);
        gl_Position = position;
        vPosition = position.xyz;
        vTexCoord = texCoord;

        // Gram-Schmidt orthogonalization
        vec3 N = normalize((normalMatrix * vec4(normal, 0.0)).xyz);
        vec3 T = normalize((normalMatrix * vec4(tangent, 0.0)).xyz);
        T = normalize(T - dot(T, N) * N);
        vec3 B = cross(N, T);

        vNormal = N;
        vTangent = T;
        vBitangent = B;
    }
`;

const fragmentShaderSource = `
    precision mediump float;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vTexCoord;
    varying vec3 vTangent;
    varying vec3 vBitangent;

    uniform vec3 lightDirection;
    uniform vec3 viewPosition;
    uniform vec3 ambientColor;
    uniform vec3 diffuseColor;
    uniform vec3 specularColor;
    uniform float shininess;
    uniform sampler2D diffuseTexture;
    uniform sampler2D specularTexture;
    uniform sampler2D normalTexture;

    void main() {
        vec3 normalMap = texture2D(normalTexture, vTexCoord).rgb * 2.0 - 1.0;
        mat3 TBN = mat3(vTangent, vBitangent, vNormal);
        vec3 normal = normalize(TBN * normalMap);

        vec3 lightDir = normalize(lightDirection - vPosition);
        vec3 viewDir = normalize(viewPosition - vPosition);

        // Ambient
        vec3 ambient = ambientColor;

        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * texture2D(diffuseTexture, vTexCoord).rgb;

        // Specular
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
        vec3 specular = spec * texture2D(specularTexture, vTexCoord).rgb;

        vec3 result = ambient + diffuse + specular;
        gl_FragColor = vec4(result, 1.0);
    }
`;
