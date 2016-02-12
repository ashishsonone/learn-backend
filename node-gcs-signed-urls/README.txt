Reference:
    https://cloud.google.com/storage/docs/xml-api/post-object#policydocument

how enable acl option:
    file : node_modules/gcs-signed-urls/src/cloudStorage.js
    function : uploadRequest
    diff : In uploadPolicy add "conditions" -> "acl" field
            Also set 'acl' field in the request object which is returned
    
    file : form.ejs
    diff: add 'acl' field in the form
