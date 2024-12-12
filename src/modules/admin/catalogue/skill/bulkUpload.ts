// import mongoose from "mongoose";
// import {
//     validateExcelColumns
//   } from "../../../../helpers/helper";
// import excelToJson from "convert-excel-to-json";
// import databaseConnection from "@/config/db";
// import Skill from "../../../../models/skill";
// import Category from "../../../../models/category";
// import message from "./skillConstant";


// databaseConnection(process.env.ATLAS_URL, process.env.LOCAL_URL);

// process.on('message', async ({ filePath, userId }) => {
//     try {
//       const data = excelToJson({
//         sourceFile: filePath,
//         sheets: ["skillUpload"],
//         sheetStubs: true,
//       });
  
//       const columns = [
//         "Name","Description","Category","IsPremium","Image"
//       ];
  
//       const excelData = await validateExcelColumns(columns, data["skillUpload"]);
//       excelData.shift(); 
      
//       for (const element of excelData) {
//         const name = element["Name"];
//         const categoryIds = await Category.findOne({
//             name:  element["Category"],
//             isDeleted:false
//         },{_id:1})
  
//         const skillData:any = await Skill.findOneAndUpdate(
//             {
//               name:name,
//               isDeleted: false,
//             },
//             {
//                 name:name,
//                 description: element["Description"],
//                 categoryId: categoryIds?._id,
//                 "image.localUrl": element["Image"],
//                 isPremium: element["IsPremium"],
//               createdBy: new mongoose.Types.ObjectId(userId),
//               updatedBy: new mongoose.Types.ObjectId(userId),
//               isDeleted: false,
//             },
//             { new: true, upsert: true }
//           );
  
//           if (!skillData) throw new Error(message.bulkFailed);
//       }
  
//       // Send success message back to parent process
//       if (process && process.send) {
//         process.send({ status: 'success' });
//       }
//     } catch (err:any) {
//       console.error('Error occurred:', err);
//       if (process && process.send) {
//         process.send({ status: 'error', message: err.message });
//       }
//     }
//   });


