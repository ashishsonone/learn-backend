============== PART 1 - UPLOAD USING POST WITH SIGNED POLICY DOCUMENTS ====
Reference:
    https://cloud.google.com/storage/docs/xml-api/post-object#policydocument

how enable acl option:
    file : node_modules/gcs-signed-urls/src/cloudStorage.js
    function : uploadRequest
    diff : In uploadPolicy add "conditions" -> "acl" field
            Also set 'acl' field in the request object which is returned
    
    file : form.ejs
    diff: add 'acl' field in the form

================PART 2 - ANONYMOUS UPLOADS =====
Set bucket ACL permissions for 'public-read-write'
gsutil acl set public-read-write gs://public-node-1189

Set default object permissions for 'public-read'
gsutil defacl set public-read gs://public-node-1189

Now use a form as in anon_upload.html for uploading purpose.
