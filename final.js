"use strict";

var gl;   // The webgl context.

var a_coords_loc;       // Location of the a_coords attribute variable in the shader program.
var a_normal_loc;       // Location of a_normal attribute.

var a_coords_buffer;    // Buffer for a_coords.
var a_normal_buffer;    // Buffer for a_normal.
var index_buffer;       // Buffer for indices.

var u_diffuseColor;     // Locations of uniform variables in the shader program
var u_lightPosition;
var u_modelview;
var u_projection;
var u_normalMatrix;   
var u_isSun
var u_isLamp
var u_isNight
var u_lampPosition

var u_headlight1Direction;
var u_headlight2Direction;

var u_headlight1
var u_headlight2

var projection = mat4.create();    // projection matrix
var modelview;                     // modelview matrix; value comes from rotator
var normalMatrix = mat3.create();  // matrix, derived from modelview matrix, for transforming normal vectors
var rotator;

var currentAngle = 0.0;
var currentCarAngle = 0.0;
var currentWheelAngle = 0.0;

var objects = [
    cube(0.5),
    ring(2.5,1.5,0),
    uvCylinder(3.4,0.1,0,0,0),
    uvTorus(0.2,0.1,0,0),
    uvSphere(0.4,0,0),
    uvSphere(0.2,0,0),
    uvCylinder(0.1,1,0,0),
    uvCone(0.4,1.5,0,0),
    cube(0.1),
    uvCylinder(0.015, 0.2),
    uvCylinder(0.02,0.85)
];

function draw() { 

    function updateUniform(modelNum)
    {
        /* Get the matrix for transforming normal vectors from the modelview matrix,
           and send matrices to the shader program*/   
           mat3.normalFromMat4(normalMatrix, modelview);
        
           gl.uniformMatrix3fv(u_normalMatrix, false, normalMatrix);
           gl.uniformMatrix4fv(u_modelview, false, modelview );
           gl.uniformMatrix4fv(u_projection, false, projection );
           
           /* Draw the model.  The data for the model was set up in installModel() */
           gl.drawElements(gl.TRIANGLES, objects[modelNum].indices.length, gl.UNSIGNED_SHORT, 0);   
    }

    gl.clearColor(0.15,0.15,0.3,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    mat4.perspective(projection,Math.PI/5,1,10,20);
    
    modelview = rotator.getViewMatrix();
    

    //Calculate the position of the Sun as it rotates around the plane
    var newLightPos = vec4.fromValues(10*Math.sin(currentAngle),10*Math.cos(currentAngle),0,1);
    newLightPos = mat4.multiply(newLightPos,modelview,newLightPos)
    gl.uniform4fv(u_lightPosition, newLightPos);

    //Calculate the position of the headlights
    var headlight1 = vec4.fromValues(1.85*Math.sin(currentCarAngle+Math.PI/2),0.5,1.85*Math.cos(currentCarAngle+Math.PI/2),1);
    var headlight2 = vec4.fromValues(2.15*Math.sin(currentCarAngle+Math.PI/2),0.5,2.1*Math.cos(currentCarAngle+Math.PI/2),1);
    headlight1 = mat4.multiply(headlight1, modelview, headlight1);
    headlight2 = mat4.multiply(headlight2, modelview, headlight2);
    gl.uniform4fv(u_headlight1, headlight1);
    gl.uniform4fv(u_headlight2, headlight2);

    //Calculate the direction of the headlights
    var headlight1Direction = vec4.fromValues(1.9*Math.sin(currentCarAngle+Math.PI/2+0.3),0.5,1.9*Math.cos(currentCarAngle+Math.PI/2+0.3),1);
    headlight1Direction = mat4.multiply(headlight1Direction, modelview, headlight1Direction);
    gl.uniform4fv(u_headlight1Direction, headlight1Direction);

    var headlight2Direction = vec4.fromValues(2.5*Math.sin(currentCarAngle+Math.PI/2+0.5),0.5,2.5*Math.cos(currentCarAngle+Math.PI/2+0.5),1);
    headlight2Direction = mat4.multiply(headlight2Direction, modelview, headlight2Direction);
    gl.uniform4fv(u_headlight2Direction, headlight2Direction);

    //Calculate the position of the lamp regard to the rotator
    var newLampPos = vec4.fromValues(0,1,0,1);
    newLampPos = mat4.multiply(newLampPos, modelview, newLampPos);
    gl.uniform4fv(u_lampPosition, newLampPos);
    

    gl.uniform1i(u_isSun, 0);

    //---------------Draw the field-----------------
    gl.uniform4f(u_diffuseColor, 0.4, 0.7, 0.2, 1); 
    installModel(objects[2]);
    mat4.rotate(modelview,modelview, -Math.PI/2, vec3.fromValues(1,0,0));
    updateUniform(2);    
    

    //--------------Draw the street-----------------
    gl.uniform4f(u_diffuseColor, 0.8, 0.8, 0.8, 1); 
    installModel(objects[1]);
    mat4.translate(modelview,modelview,vec3.fromValues(0,0,0.051));
    updateUniform(1);

    mat4.rotate(modelview,modelview, Math.PI/2, vec3.fromValues(1,0,0));
    
    //-------------------Draw the lamp----------------
    gl.uniform4f(u_diffuseColor, 0.3, 0.3, 0.1, 1); 
    gl.uniform1i(u_isLamp, 1);
    installModel(objects[5]);
    mat4.translate(modelview, modelview, vec3.fromValues(0,1,0));
    updateUniform(5);
    gl.uniform1i(u_isLamp, 0);

    mat4.translate(modelview, modelview, vec3.fromValues(0,-1,0));

    gl.uniform4f(u_diffuseColor, 0.5,0,0,1);
    installModel(objects[6]);
    mat4.translate(modelview, modelview, vec3.fromValues(0,0.5,0));
    mat4.rotate(modelview, modelview, Math.PI/2, vec3.fromValues(1,0,0));
    updateUniform(6);

    mat4.rotate(modelview, modelview, -Math.PI/2, vec3.fromValues(1,0,0));
    mat4.translate(modelview, modelview, vec3.fromValues(0,-0.5,0));

    //--------------------Draw the trees---------------
    var placeATree = (scale, myX, myY) =>
    {
        gl.uniform4f(u_diffuseColor, 0.5,0,0,1);
        installModel(objects[6]);
        mat4.scale(modelview, modelview, vec3.fromValues(scale,scale,scale));
        mat4.translate(modelview, modelview, vec3.fromValues(myX,0.5,myY));
        mat4.rotate(modelview, modelview, Math.PI/2, vec3.fromValues(1,0,0));
        updateUniform(6);
    
        mat4.rotate(modelview, modelview, -Math.PI/2, vec3.fromValues(1,0,0));
        mat4.translate(modelview, modelview, vec3.fromValues(-myX,-0.5,-myY));
        mat4.scale(modelview, modelview, vec3.fromValues(1/scale,1/scale,1/scale));
    
        gl.uniform4f(u_diffuseColor, 0.4,0.7,0,1);
        installModel(objects[7]);
        mat4.scale(modelview, modelview, vec3.fromValues(scale,scale,scale));
        mat4.translate(modelview, modelview, vec3.fromValues(myX,1,myY));
        mat4.rotate(modelview, modelview, -Math.PI/2, vec3.fromValues(1,0,0));
        updateUniform(7);
    
        mat4.rotate(modelview, modelview, Math.PI/2, vec3.fromValues(1,0,0));
        mat4.translate(modelview, modelview, vec3.fromValues(-myX,-1,-myY));
        mat4.scale(modelview, modelview, vec3.fromValues(1/scale,1/scale,1/scale));
    }
    placeATree(0.8, 0.5, 0.7);
    placeATree(0.5, -0.7,-1);
    placeATree(1, -0.9,0.6);
    placeATree(0.4,-1.2, 1.5);
    placeATree(0.4, 2,2);
    placeATree(1.2, 0.5, -0.6);
    placeATree(1, -2.1,-2.1);
    placeATree(0.5, 5.3,0);
    placeATree(1, 3,0.3);
    placeATree(1,2.8,-0.3);
    placeATree(0.6,3.8,3.8);
    placeATree(0.8,-2.9,2.1);

    //-------------------Draw the Sun------------------
    gl.uniform1i(u_isSun, 1);
    installModel(objects[4]);
    mat4.rotate(modelview,modelview,-currentAngle, vec3.fromValues(0,0,1));
    mat4.translate(modelview,modelview,vec3.fromValues(0,3.7,0));
    updateUniform(4);
    gl.uniform1i(u_isSun, 0);

    mat4.translate(modelview,modelview,vec3.fromValues(0,-3.7,0));
    mat4.rotate(modelview,modelview,currentAngle, vec3.fromValues(0,0,1));

    //------------------Draw the wheels---------------
    var installWheel = (myX, myZ) =>
    {
        gl.uniform4f(u_diffuseColor, 0.3,0,0,1);
        var installInnerWheel = (angle) =>
        {
            installModel(objects[9]);

            mat4.rotate(modelview, modelview, currentCarAngle, vec3.fromValues(0,1,0));
            mat4.translate(modelview, modelview, vec3.fromValues(myX, 0.2, myZ));
            mat4.rotate(modelview, modelview, -currentWheelAngle - angle, vec3.fromValues(1,0,0));

            updateUniform(9);              

            mat4.rotate(modelview, modelview, currentWheelAngle + angle, vec3.fromValues(1,0,0));
            mat4.translate(modelview, modelview, vec3.fromValues(-myX, -0.2, -myZ));
            mat4.rotate(modelview, modelview, -currentCarAngle, vec3.fromValues(0,1,0));            
        }
        var i = 0;
        for (i = 0; i < 4; i++) installInnerWheel(i*Math.PI/4);

        installModel(objects[3]);

        mat4.rotate(modelview, modelview, currentCarAngle, vec3.fromValues(0,1,0));
        mat4.translate(modelview, modelview, vec3.fromValues(myX, 0.2, myZ));
        mat4.rotate(modelview, modelview, Math.PI/2, vec3.fromValues(0,1,0));
        mat4.rotate(modelview, modelview, -currentWheelAngle, vec3.fromValues(0,0,1));

        updateUniform(3);
        mat4.rotate(modelview, modelview, currentWheelAngle, vec3.fromValues(0,0,1));
        mat4.rotate(modelview, modelview, -Math.PI/2, vec3.fromValues(0,1,0));
        mat4.translate(modelview, modelview, vec3.fromValues(-myX, -0.2, -myZ));
        mat4.rotate(modelview, modelview, -currentCarAngle, vec3.fromValues(0,1,0));
        
    }
    installWheel(1.6,0.3);
    installWheel(1.6,-0.3);
    installWheel(2.3,0.3);
    installWheel(2.3,-0.3)
    
    var drawWheelRod = (myZ) =>
    {
        installModel(objects[10]);
        mat4.rotate(modelview, modelview, currentCarAngle, vec3.fromValues(0,1,0));
        mat4.translate(modelview, modelview, vec3.fromValues(1.95,0.2,myZ));
        mat4.rotate(modelview, modelview, Math.PI/2, vec3.fromValues(0,1,0));
        updateUniform(10);
        mat4.rotate(modelview, modelview, -Math.PI/2, vec3.fromValues(0,1,0));
        mat4.translate(modelview, modelview, vec3.fromValues(-1.95, -0.2,-myZ));
        mat4.rotate(modelview, modelview, -currentCarAngle, vec3.fromValues(0,1,0));
    }
    drawWheelRod(0.3);
    drawWheelRod(-0.3);

    //-----------------Draw the headlights-----------------
    var drawHeadlight = (myX) =>
    {
        gl.uniform1i(u_isLamp,1);
        installModel(objects[8]);
        mat4.rotate(modelview, modelview, currentCarAngle, vec3.fromValues(0,1,0));
        mat4.translate(modelview,modelview,vec3.fromValues(myX,0.3,-0.5));
        mat4.scale(modelview, modelview, vec3.fromValues(2,1,1));
        updateUniform(8);
    
        mat4.scale(modelview, modelview, vec3.fromValues(0.5,1,1));
        mat4.translate(modelview,modelview,vec3.fromValues(-myX, -0.3, 0.5));
        mat4.rotate(modelview, modelview, -currentCarAngle, vec3.fromValues(0,1,0));

        gl.uniform1i(u_isLamp,0);
    }

    drawHeadlight(1.8);
    drawHeadlight(2.1);

    //----------------Draw the car------------------
    gl.uniform4f(u_diffuseColor, 0.9, 0, 1, 1); 
    installModel(objects[0]);
    mat4.rotate(modelview, modelview, currentCarAngle, vec3.fromValues(0,1,0));
    mat4.scale(modelview, modelview, vec3.fromValues(1.2,0.6,2));
    mat4.translate(modelview, modelview, vec3.fromValues(1.62,0.42,0));
    updateUniform(0);

    installModel(objects[0]);
    mat4.scale(modelview, modelview, vec3.fromValues(0.95,1.5,0.65));
    mat4.translate(modelview,modelview,vec3.fromValues(0,0.15,0.1));
    updateUniform(0);
}

function installModel(modelData) {
    gl.bindBuffer(gl.ARRAY_BUFFER, a_coords_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_coords_loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_coords_loc);
    gl.bindBuffer(gl.ARRAY_BUFFER, a_normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_normal_loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_normal_loc);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
}

function initGL() {
    var prog = createProgram(gl,"vshader-source","fshader-source");
    gl.useProgram(prog);
    a_coords_loc =  gl.getAttribLocation(prog, "a_coords");
    a_normal_loc =  gl.getAttribLocation(prog, "a_normal");
    u_modelview = gl.getUniformLocation(prog, "modelview");
    u_projection = gl.getUniformLocation(prog, "projection");
    u_normalMatrix =  gl.getUniformLocation(prog, "normalMatrix");
    u_lightPosition=  gl.getUniformLocation(prog, "lightPosition");
    u_diffuseColor =  gl.getUniformLocation(prog, "diffuseColor");

    u_headlight1Direction = gl.getUniformLocation(prog, "headlight1Direction");
    u_headlight2Direction = gl.getUniformLocation(prog, "headlight2Direction");

    u_headlight1 = gl.getUniformLocation(prog, "headlight1");
    u_headlight2 = gl.getUniformLocation(prog, "headlight2");

    u_isSun = gl.getUniformLocation(prog, "isSun");
    u_isLamp = gl.getUniformLocation(prog, "isLamp");

    u_lampPosition = gl.getUniformLocation(prog, "lampPosition");
    u_isNight = gl.getUniformLocation(prog,"isNight");

    a_coords_buffer = gl.createBuffer();
    a_normal_buffer = gl.createBuffer();
    index_buffer = gl.createBuffer();
    gl.enable(gl.DEPTH_TEST);
    

    gl.uniform1i(u_isNight, 0);
    gl.uniform1i(u_isSun, 0);
    gl.uniform1i(u_isLamp, 0);  
    gl.uniform4f(u_headlight1Direction, 0,0,0,1);
    gl.uniform4f(u_headlight2Direction, 0,0,0,1);
    gl.uniform4f(u_diffuseColor, 0, 1, 1, 1);        
    gl.uniform4f(u_lightPosition, 0, 10, 0, 1); 
    gl.uniform4f(u_lampPosition, 0, 1, 0, 1);
    gl.uniform4f(u_headlight1, 0,0,0,1);
    gl.uniform4f(u_headlight2, 0,0,0,1);

}

function createProgram(gl, vertexShaderID, fragmentShaderID) {
    function getTextContent( elementID ) {
            // This nested function retrieves the text content of an
            // element on the web page.  It is used here to get the shader
            // source code from the script elements that contain it.
        var element = document.getElementById(elementID);
        var node = element.firstChild;
        var str = "";
        while (node) {
            if (node.nodeType == 3) // this is a text node
                str += node.textContent;
            node = node.nextSibling;
        }
        return str;
    }
    try {
        var vertexShaderSource = getTextContent( vertexShaderID );
        var fragmentShaderSource = getTextContent( fragmentShaderID );
    }
    catch (e) {
        throw "Error: Could not get shader source code from script elements.";
    }
    var vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vertexShaderSource);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
     }
    var fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
    }
    var prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw "Link error in program:  " + gl.getProgramInfoLog(prog);
    }
    return prog;
}

function animate()
{
    if (document.getElementById("animateBox").checked) {
        currentAngle += 0.011;
        currentAngle %= (2*Math.PI);

        if (currentAngle > Math.PI/2 && currentAngle < Math.PI*3/2)
            gl.uniform1i(u_isNight,1);
        else gl.uniform1i(u_isNight,0);

        currentCarAngle += 0.023;
        currentCarAngle %= (2*Math.PI);

        currentWheelAngle += 0.1;
        currentWheelAngle %= (2*Math.PI);
    }
}

function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}


function init() {
    try {
        var canvas = document.getElementById("myGLCanvas");
        gl = canvas.getContext("webgl") || 
                         canvas.getContext("experimental-webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context:" + e + "</p>";
        return;
    }
    rotator = new TrackballRotator(canvas, draw, 15, vec3.fromValues(0.0,5.0,10.0));
    tick();
}