## STEP-BY-STEP: Take NEW backup & download it

### 1. Switch to postgres Linux user

```
sudo su - postgres
```

### 2. Create the backup

```
pg_dump mykunba > mykunba_backup.sql
```

### 3. Compress the backup and exit from postgres

```
gzip mykunba_backup.sql
exit
```

#### Now you should be back at "ec2-user@ip-172-31-7-147"

### 4. Move backup to ec2-user home

```
sudo mv /var/lib/pgsql/mykunba_backup.sql.gz /home/ec2-user/
```

### 5. Fix ownership

```
sudo chown ec2-user:ec2-user /home/ec2-user/mykunba_backup.sql.gz
```

### SINGLE COMMAND FOR ALL THE ABOVE IN PLACE OF ALL THE ABOVE COMMANDS

```
sudo -u postgres pg_dump mykunba | gzip > ~/mykunba_backup.sql.gz
```

### 6. Verify file exists

```
ls -lh /home/ec2-user/mykunba_backup.sql.gz
```

#### Move out of the AWS linux CMD or open a new powershell tab. Because the below command will run on local system.

### 7. ✅ DOWNLOAD TO LOCAL SYSTEM (FINAL STEP)

```
scp -i "C:\Users\lbhat\.ssh\mykunba.pem" ec2-user@3.6.239.45:/home/ec2-user/mykunba_backup.sql.gz .
```

#### In the above command "C:\Users\lbhat\.ssh\mykunba.pem" this is the path of the .pem key for the ec2 instance. And a dot(.) in end states that I want to download the backup in this folder only, if we want to download the backup on another folder we can give path of that folder too instead of dot(.)

## Run the backup locally

### 1. Extract the .sql file. (Because we can't restore the backup from the .gz file. The file must be a .sql file)

### 2. Open pgadmin

### 3. Expand PostgreSQL 18

#### Right click on it -> Connect server

### 4. Create a new database

### 5. Restore the backup

#### Right click on the newly create database -> Click restore

#### Under the dialog:

#### 1. Format -> Plain

#### 2. Filename -> Browse and select the .sql

If the .sql file is not visible even after browswing to the exact file location then open a new folder and go to that .sql file and then copy the file location by right click on the .sql file.

### 6. Start Restore

### 🎉 Restore successful
