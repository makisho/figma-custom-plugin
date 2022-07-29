
figma.showUI(__html__, { width: 400, height: 600 });

figma.ui.onmessage = msg => {
  if (msg.type === "populateComponent") {
    const layerMap = msg.data
    console.log('Message: ',layerMap)
    handleText(layerMap, figma.currentPage.selection[0])
  } else if (msg.type === "populateImage") {
    const { imageBytes, key } = msg.data;
    handleImage(imageBytes, key, figma.currentPage.selection[0])
  } else if (msg.type === "cancel") {
    figma.closePlugin();
  }else if(msg.type === "exportNewsletter"){
    handleExport(figma.currentPage.selection[0])
  }
};

const loadFonts = async () => {
  await figma.loadFontAsync({ family: "DIN PRO for BRM", style: "Bold" }) 
  console.log("Awaiting the fonts.")
}

// Load the fonts by running the function
loadFonts().then(() => {
  // Make them useful
  //doSomethingElseWithThem()
  console.log("Fonts fetched and ready to go!")

})

const valueForCaseInsensitiveKey = (object, caseInsensitiveKey): string => {
  return object[Object.keys(object)
    .find(k => k.toLowerCase() === caseInsensitiveKey.toLowerCase())
  ];
}


var style1, style2;


const handleText = (layerMap, node) => {
  // if node has children, iterate and call this method again
  // otherwise see if it's a text field



  if ("children" in node) {
    for (const child of node.children) {
      handleText(layerMap, child)
    }
  } else {
    // check if node is text
    if ("characters" in node) {
      // match name to layerMap
      const value = valueForCaseInsensitiveKey(layerMap, node.name)

      if(node.name==="#PrecioEntero"){
        style1 = node.getStyledTextSegments(['textStyleId'], 0, 1);
        console.log('style1: ',style1[0].textStyleId)
      }

      if(node.name ==="#PrecioDecimales"){
        style2 = node.getStyledTextSegments(['textStyleId'], 0, 2);
        console.log('style2: ',style2[0].textStyleId)
      }
    

      if(node.name==="#Precio"){
                      
          var e = valueForCaseInsensitiveKey(layerMap, "#PrecioEntero");
          node.deleteCharacters(0,node.characters.length);
          node.insertCharacters(0,e);
          console.log('1 inserted ',0,e,e.length)
          node.setRangeTextStyleId(0, e.length, style1[0].textStyleId)

          var d = valueForCaseInsensitiveKey(layerMap, "#PrecioDecimales");
          //node.deleteCharacters(e.length+1,e.length+d.length);
          node.insertCharacters(node.characters.length,d);
          node.setRangeTextStyleId(e.length, e.length+d.length, style2[0].textStyleId)

          //node.deleteCharacters(e.length,e.length+1);
          // console.log('1 deleteCharacters ',e.length,e.length+1)
          // var displ = e.length;
          // console.log('1 deleteCharacters ',e.length,e.length+1)
          //node.deleteCharacters(displ+1,node.characters.length);
          // node.insertCharacters(displ+1,valueForCaseInsensitiveKey(layerMap, "#PrecioDecimales"))
          // node.setRangeTextStyleId(displ+1, node.characters.length, style2[0].textStyleId)
          // var e = v.replace('{P}',valueForCaseInsensitiveKey(layerMap, "#PrecioEntero"))
          // var d = v.replace('{D}',valueForCaseInsensitiveKey(layerMap, "#PrecioDecimales"))

          // const fontName = node.fontName as FontName
          // figma.loadFontAsync(fontName).then(() => {
          //     node.characters = e+''+d;
          //   })

      }
      else if (value) {
        console.log('characters > ',value)
        const fontName = node.fontName as FontName
        figma.loadFontAsync(fontName).then(() => {
          node.characters = value
        })
      }else{

      }
    }
  }
}

const handleImage = (imageBytes, key, node) => {

  //console.log("handleImage TS: ",imageBytes,key,node)

  if ("children" in node) {
    for (const child of node.children) {
      handleImage(imageBytes, key, child)
    }
  } else {
    if ("fills" in node && node.name.toLowerCase() === key.toLowerCase()) {
      const imageRectangleNode = node as RectangleNode
      const image = figma.createImage(imageBytes)
     
      imageRectangleNode.fills = [{
        type: 'IMAGE',
        scaleMode: 'FILL',
        imageHash: image.hash
      }
      ];
    }
  }
}



// (async () => {
//   const polygon = figma.createPolygon()
//   polygon.pointCount = 6
//   polygon.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]

//   // Export a 2x resolution PNG of the node
//   const bytes = await polygon.exportAsync({
//     format: 'PNG',
//     constraint: { type: 'SCALE', value: 2 },
//   })

//   // Add the image onto the canvas as an image fill in a frame
//   const image = figma.createImage(bytes)
//   const frame = figma.createFrame()
//   frame.x = 200
//   frame.resize(200, 230)
//   frame.fills = [{
//     imageHash: image.hash,
//     scaleMode: "FILL",
//     scalingFactor: 1,
//     type: "IMAGE",
//   }]
// })()

const handleExport = (node) => {
 // if node has children, iterate and call this method again
  // otherwise see if it's a text field
  if ("children" in node) {
    for (const child of node.children) {
      
      console.log('Looping > ',child.name);
      if ("ImageComponent" === node.name) {
        console.log('Export IMAGE > ',child.name, child.parent.name);
        // child.parent.exportAsync({format: 'PNG'}).then(
        //   res => console.log(String.fromCharCode.apply(null, res))).catch(err => console.error(err));

        let exportNode = child.parent;

        exportNode.exportAsync({
          format: "PNG",
            constraint: {
              type: "SCALE",
              value: 2,
            }
        }).then(
          resolved => {
            sendToUi(resolved)
           },
          rejected => {
            console.error(rejected)
          }
        )
        
        function sendToUi(imagedata){
          console.log('exporting...: ')
          figma.ui.postMessage({type: 'generateZIP', data: imagedata})
        }
          
      }
      handleExport(child);
    }
  } else {
    // check if node is text
    // console.log('node.name > ',node.name);
    //   if ("ImageComponent" === node.name) {
    //     console.log('node.name > ',node.name);
    // //   // match name to layerMap
    // //   // const value = valueForCaseInsensitiveKey(layerMap, node.name)
    // //   // if (value) {
    // //   //   const fontName = node.fontName as FontName
    // //   //   figma.loadFontAsync(fontName).then(() => {
    // //   //     node.characters = value
    // //   //   })
    // //   // }
    // }
  }

}