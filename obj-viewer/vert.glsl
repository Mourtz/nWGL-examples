#version 300 es

precision highp float;

layout (location=0) in vec3 a_position;
layout (location=1) in vec3 a_normal;
layout (location=2) in vec3 a_offset;

uniform mat4 u_model_matrix, u_view_matrix, u_projection_matrix;
uniform float u_fudgeFactor;
// uniform float u_time;

flat out vec3 v_normal;

void main() {
  const int el_p_row = 3;
  int row = gl_InstanceID/el_p_row;
  int depth = row/el_p_row;

  gl_Position = u_projection_matrix * u_view_matrix * u_model_matrix * 
    (vec4(a_position, 1.0) + vec4((gl_InstanceID-el_p_row*row)*4, (row-el_p_row*depth)*3, depth*4, 0.0));
  v_normal = a_normal;
}