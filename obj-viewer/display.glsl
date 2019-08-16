#version 300 es

precision highp float;

layout(location = 0) out highp vec4 FragColor;
uniform vec2 u_resolution;

flat in vec3 v_normal;

const vec3 light_dir = normalize(vec3(0.0, 0.0, 1.0));
void main() {
	// FragColor = vec4(vec3(dot(v_normal,light_dir)), 1.0);
	FragColor = vec4(vec3(v_normal), 1.0);
}