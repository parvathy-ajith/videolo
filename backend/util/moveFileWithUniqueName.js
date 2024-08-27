const path = require('path');
const fs = require('fs').promises;

//function to re-name file if it exists in target_directory
const moveFileWithUniqueName = async (file, targetDir) => {
    const originalName = file.name;
    let fileName = originalName;
    const filePath = path.join(targetDir, originalName);
    try {
      //check if file exists
      await fs.access(filePath);

      //No error thrown, so the file exists, generate a new unique name
      const fileExtension = path.extname(originalName);
      const fileBaseName = path.basename(originalName, fileExtension);
      fileName = `${fileBaseName}-${Date.now()}${fileExtension}`;
    } catch (error) {
      // If the file does not exist fs.access(filePath) throws error caught by this catch, error is anticipated, continue with the original name
    }

    // Move the file to the target directory
    await file.mv(path.join(targetDir, fileName));

    return fileName
  }

  module.exports = moveFileWithUniqueName;