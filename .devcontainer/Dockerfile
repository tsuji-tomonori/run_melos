FROM public.ecr.aws/aws-mde/universal-image:3.0
# Switch to root user to perform file copy
USER root
RUN  yum update -y &&  yum install -y npm
RUN pip3.11 install --upgrade pip && \
    ln -sf  /usr/share/zoneinfo/Asia/Tokyo /etc/localtime
COPY requirements-dev.txt  /home/mde-user/requirements-dev.txt
COPY .bash_profile  /home/mde-user/.bash_profile
COPY .bashrc  /home/mde-user/.bashrc
RUN ls ~/ && \
    pip3.11 install -r /home/mde-user/requirements-dev.txt
RUN  npm cache clean --force && \
    npm install -g aws-cdk @go-task/cli @aws-cdk/integ-runner
# Switch back to the original user if needed
USER mde-user