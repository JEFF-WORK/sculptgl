define([
  'gui/GuiTR'
], function (TR) {

  'use strict';

  function GuiMesh(guiParent, ctrlGui) {
    this.sculptgl_ = ctrlGui.sculptgl_; // main application

    this.domVerts = document.createElement('ul');
    this.domVerts.innerHTML = TR('meshNbVertices');

    this.domFaces = document.createElement('ul');
    this.domFaces.innerHTML = TR('meshNbFaces');

    this.domUl = document.createElement('span');
    this.domUl.appendChild(this.domVerts);
    this.domUl.appendChild(this.domFaces);
    var style = this.domUl.style;
    style.cursor = 'default';
    if (style.float === undefined) style.cssFloat = 'right';
    else style.float = 'right';

    guiParent.domTopbar.appendChild(this.domUl);
  }

  GuiMesh.prototype = {
    /** Update number of vertices and faces */
    updateMeshInfo: function (mesh) {
      this.domVerts.innerHTML = TR('meshNbVertices') + mesh.getNbVertices();
      this.domFaces.innerHTML = TR('meshNbFaces') + mesh.getNbFaces();
    }
  };

  return GuiMesh;
});