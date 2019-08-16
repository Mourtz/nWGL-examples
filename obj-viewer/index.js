const canvas_size = [window.innerWidth, window.innerHeight];
let canvas_scale = 1;

let sandbox = new nWGL.main({ "width": canvas_size[0], "height": canvas_size[1], "disable_quad_vbo": true, "enableDepthTest": true, "autoClear": true });

//------------------------- Buffers -------------------------

let model = nWGL.loadOBJ("suzanne.obj");

let normals_buffer  = sandbox.addBuffer(
    {
        "data": model.normals
    },
    "normals_buffer");

let vertices_buffer  = sandbox.addBuffer(
    {
        "data": model.vertices
    },
    "vertices_buffer");

let indices_buffer2 = sandbox.addBuffer(
    {
        "target": "ELEMENT_ARRAY_BUFFER",
        "data": model.faces[0]
    },
    "indices_buffer2");

vertices_buffer.enableVertexAttribArray({"index": 0, "size": 3});
normals_buffer.enableVertexAttribArray({"index": 1, "size": 3});

indices_buffer2.bind();

//------------------------- Shaders -------------------------
sandbox.addShader("vert.glsl", "vertex_shader", true);
sandbox.addShader("display.glsl", "display_shader");

//------------------------- Display Program -------------------------
sandbox.addProgram(["vertex_shader", "display_shader"], "display");

var translation = [0, 0, 0];
var rotation = [nWGL.helper.degToRad(0), nWGL.helper.degToRad(0), nWGL.helper.degToRad(0)];
var scale = [1, 1, 1];
var fieldOfViewRadians = nWGL.helper.degToRad(60);

// Compute the matrix
let aspect = sandbox.gl.canvas.clientWidth / sandbox.gl.canvas.clientHeight;
let zNear = 0.001;
let zFar = 500;
let matrix = nWGL.helper.perspective(fieldOfViewRadians, aspect, zNear, zFar);
matrix = nWGL.helper.translate(matrix, translation[0], translation[1], translation[2]);
matrix = nWGL.helper.xRotate(matrix, rotation[0]);
matrix = nWGL.helper.yRotate(matrix, rotation[1]);
matrix = nWGL.helper.zRotate(matrix, rotation[2]);
matrix = nWGL.helper.scale(matrix, scale[0], scale[1], scale[2]);
sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);

//------------------------- Render Loop -------------------------
const realtime = false;
function render() {
    // sandbox.draw("LINE_LOOP", 6);
    sandbox.draw("TRIANGLES", model.faces[0].length, true);
    if(realtime)
        window.requestAnimationFrame(render);
};


let mouse_down = false;
let click_pos = null;
document.addEventListener('mousedown', function(event){;
    click_pos = [event.x, event.y];
    mouse_down = true;
});

document.addEventListener('mousemove', function(event){
    if(!mouse_down) return;

    let delta = [event.x - click_pos[0], event.y - click_pos[1]];
    click_pos = [event.x, event.y];
    
    delta[0] = nWGL.helper.degToRad(delta[0]*0.08);
    delta[1] = nWGL.helper.degToRad(delta[1]*0.08);

    rotation[1] += delta[0];
    // rotation[0] += delta[1];
            
    matrix = nWGL.helper.translate(matrix, -translation[0], -translation[1], -translation[2]);
    matrix = nWGL.helper.yRotate(matrix, delta[0]);
    // matrix = nWGL.helper.xRotate(matrix, delta[1]);
    matrix = nWGL.helper.translate(matrix, translation[0], translation[1], translation[2]);

    sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
    if(!realtime) render();
});

document.addEventListener('mouseup', function(event){
    mouse_down = false;
});

document.addEventListener('keydown', function(event) {
    const translation_step = [1, 1, 1];
    const rotation_step = [
        nWGL.helper.degToRad(1),
        nWGL.helper.degToRad(1), 
        nWGL.helper.degToRad(1)
    ];
    
    // let temp = matrix;
    let temp1, temp2;

    switch(event.keyCode){
        // d - right
        case 68:
            temp1 = Math.cos(rotation[1])*translation_step[0];
            temp2 = Math.sin(rotation[1])*translation_step[0];

            translation[0] -= temp1;
            translation[2] -= temp2;
            matrix = nWGL.helper.translate(matrix, -temp1, 0, -temp2);
            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        // a - left
        case 65:
            temp1 = Math.cos(rotation[1])*translation_step[0];
            temp2 = Math.sin(rotation[1])*translation_step[0];

            translation[0] += temp1;
            translation[2] += temp2;
            matrix = nWGL.helper.translate(matrix, temp1, 0, temp2);
            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        // q - top
        case 81:
            translation[1] -= translation_step[1];
            matrix = nWGL.helper.translate(matrix, 0, -translation_step[1], 0);
            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        // r - bottom
        case 82:
            translation[1] += translation_step[1];
            matrix = nWGL.helper.translate(matrix, 0, translation_step[1], 0);
            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        // w - front
        case 87:
            temp1 = Math.sin(rotation[1])*translation_step[2];
            temp2 = Math.cos(rotation[1])*translation_step[2];

            translation[0] -= temp1;
            translation[2] += temp2;
            matrix = nWGL.helper.translate(matrix, -temp1, 0, temp2);
            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        // s - back
        case 83:
            temp1 = Math.sin(rotation[1])*translation_step[2];
            temp2 = Math.cos(rotation[1])*translation_step[2];

            translation[0] += temp1;
            translation[2] -= temp2;
            matrix = nWGL.helper.translate(matrix, temp1, 0, -temp2);
            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        // right arrow - Y local axis rotation 
        case 39:
            rotation[1] += rotation_step[1];
            
            matrix = nWGL.helper.translate(matrix, -translation[0], -translation[1], -translation[2]);
            matrix = nWGL.helper.yRotate(matrix, rotation_step[1]);
            matrix = nWGL.helper.translate(matrix, translation[0], translation[1], translation[2]);

            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        // left arrow - Y local axis rotation 
        case 37:
            rotation[1] -= rotation_step[1];

            matrix = nWGL.helper.translate(matrix, -translation[0], -translation[1], -translation[2]);
            matrix = nWGL.helper.yRotate(matrix, -rotation_step[1]);
            matrix = nWGL.helper.translate(matrix, translation[0], translation[1], translation[2]);

            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        default:
            break;
    }
});

render();